-- Amplía el check de payment_method para incluir los valores usados por el checkout
-- La constraint original solo tenía 'mercadopago' y 'efectivo'
-- El checkout envía 'cash' y 'transfer'
ALTER TABLE orders DROP CONSTRAINT orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method = ANY (ARRAY['mercadopago','efectivo','cash','transfer']));
