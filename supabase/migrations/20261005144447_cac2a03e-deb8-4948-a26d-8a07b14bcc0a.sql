REVOKE EXECUTE ON FUNCTION public.get_order_payment_status(uuid) FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.get_order_payment_status(uuid);