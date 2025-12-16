// Shared financial calculations for orders/invoices/reports
// Keeps UI consistent even if legacy DB rows have incorrect stored totals.

export type OrderLike = any;

export function getOrderItems(order: OrderLike): any[] {
  return order?.items || order?.order_items || order?.admin_order_items || [];
}

export function calculateOrderFinancials(order: OrderLike) {
  const items = getOrderItems(order);

  const subtotal = items.reduce((sum: number, item: any) => {
    const qty = Number(item?.quantity ?? 1);
    const unit = Number(item?.unit_price ?? item?.price ?? 0);
    const itemDiscount = Number(item?.item_discount ?? 0);
    const explicitTotal = item?.total_price;

    const itemTotal = explicitTotal != null
      ? Number(explicitTotal)
      : unit * qty - itemDiscount;

    return sum + itemTotal;
  }, 0);

  const shipping = Number(order?.shipping_cost ?? 0);
  const discount = Number(order?.discount ?? 0);

  const computedTotal = subtotal + shipping - discount;
  const dbTotal = Number(order?.total_amount ?? order?.total ?? 0);

  // Prefer computed total when we have items (fixes legacy rows where total was saved as remaining).
  const total = items.length > 0 ? computedTotal : (dbTotal || computedTotal);

  const deposit = Number(order?.deposit ?? 0);
  const paymentsReceived = Number(order?.payments_received ?? 0);
  const paid = deposit + paymentsReceived;

  const remaining = Math.max(0, total - paid);

  return { items, subtotal, shipping, discount, total, paid, remaining, deposit, paymentsReceived };
}
