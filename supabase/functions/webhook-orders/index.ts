
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WebhookOrderData {
  webhook_key: string;
  paymentMethod: string;
  clientName: string;
  phone: string;
  deliveryMethod: string;
  address?: string;
  governorate?: string;
  shippingCost: number;
  deposit: number;
  items: Array<{
    productType: string;
    size: string;
    quantity: number;
    cost: number;
    price: number;
    itemDiscount?: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Webhook request received');
    
    // Parse request body
    let orderData: WebhookOrderData;
    try {
      orderData = await req.json();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Order data received:', orderData);

    // Validate required fields
    if (!orderData.webhook_key || !orderData.clientName || !orderData.phone || !orderData.items || orderData.items.length === 0) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: webhook_key, clientName, phone, items' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find webhook config by key
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('webhook_configs')
      .select('user_id, is_active')
      .eq('webhook_key', orderData.webhook_key)
      .single();

    if (webhookError || !webhookConfig) {
      console.error('Invalid webhook key:', webhookError);
      await logWebhookRequest(supabase, null, orderData, 401, 'Invalid webhook key');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!webhookConfig.is_active) {
      console.error('Webhook is disabled');
      await logWebhookRequest(supabase, webhookConfig.user_id, orderData, 403, 'Webhook is disabled');
      return new Response(
        JSON.stringify({ error: 'Webhook is disabled' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate serial number
    const { data: serialData, error: serialError } = await supabase.rpc('generate_serial_number');
    let serial: string;
    
    if (serialError) {
      console.error('Error generating serial number:', serialError);
      // Fallback serial number generation
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const timestamp = now.getTime().toString().slice(-4);
      serial = `INV-${year}${month}-${timestamp}`;
    } else {
      serial = serialData;
    }

    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => {
      const discountedPrice = item.price - (item.itemDiscount || 0);
      return sum + discountedPrice * item.quantity;
    }, 0);

    const totalAmount = subtotal + orderData.shippingCost - orderData.deposit;
    
    const totalProfit = orderData.items.reduce((sum, item) => {
      const discountedPrice = item.price - (item.itemDiscount || 0);
      return sum + (discountedPrice - item.cost) * item.quantity;
    }, 0) - orderData.shippingCost;

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: webhookConfig.user_id,
        serial,
        payment_method: orderData.paymentMethod,
        client_name: orderData.clientName,
        phone: orderData.phone,
        delivery_method: orderData.deliveryMethod,
        address: orderData.address || '',
        governorate: orderData.governorate || '',
        shipping_cost: orderData.shippingCost,
        discount: 0,
        deposit: orderData.deposit,
        total: totalAmount,
        profit: totalProfit,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order:', orderError);
      await logWebhookRequest(supabase, webhookConfig.user_id, orderData, 500, 'Error creating order');
      return new Response(
        JSON.stringify({ error: 'Error creating order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_type: item.productType,
      size: item.size,
      quantity: item.quantity,
      cost: item.cost,
      price: item.price,
      profit: (item.price - (item.itemDiscount || 0) - item.cost) * item.quantity,
      item_discount: item.itemDiscount || 0
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
      // Delete the order if items insertion failed
      await supabase.from('orders').delete().eq('id', order.id);
      await logWebhookRequest(supabase, webhookConfig.user_id, orderData, 500, 'Error creating order items');
      return new Response(
        JSON.stringify({ error: 'Error creating order items' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Order created successfully:', serial);
    await logWebhookRequest(supabase, webhookConfig.user_id, orderData, 200, 'Order created successfully', serial);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_serial: serial,
        message: 'Order created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function logWebhookRequest(
  supabase: any, 
  userId: string | null, 
  requestData: any, 
  status: number, 
  message: string,
  orderSerial?: string
) {
  if (!userId) return;
  
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        user_id: userId,
        order_serial: orderSerial || null,
        request_data: requestData,
        response_status: status,
        response_message: message
      });
  } catch (error) {
    console.error('Error logging webhook request:', error);
  }
}
