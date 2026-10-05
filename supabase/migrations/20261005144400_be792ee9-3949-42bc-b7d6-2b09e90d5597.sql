ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending','paid','failed','cancelled'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_order_payment_status(p_order_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('order_number', order_number, 'total', total, 'payment_status', payment_status)
  FROM public.orders WHERE id = p_order_id
$$;
GRANT EXECUTE ON FUNCTION public.get_order_payment_status(uuid) TO anon, authenticated;