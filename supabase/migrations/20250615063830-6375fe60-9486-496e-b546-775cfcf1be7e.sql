
-- Create webhook_configs table to store webhook settings
CREATE TABLE public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_key TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook_logs table to track incoming webhook requests
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  order_serial TEXT,
  request_data JSONB NOT NULL,
  response_status INTEGER NOT NULL,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for webhook_configs
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook configs" 
  ON public.webhook_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook configs" 
  ON public.webhook_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs" 
  ON public.webhook_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs" 
  ON public.webhook_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add Row Level Security (RLS) for webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook logs" 
  ON public.webhook_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook logs" 
  ON public.webhook_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
