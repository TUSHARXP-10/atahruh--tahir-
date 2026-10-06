-- Payments become gateway-neutral (Paytm replaces Razorpay). Renames keep existing rows.
ALTER TYPE "PaymentMethod" RENAME VALUE 'RAZORPAY' TO 'ONLINE';

ALTER TABLE "Order" RENAME COLUMN "razorpayOrderId" TO "gatewayOrderId";
ALTER TABLE "Order" RENAME COLUMN "razorpayPaymentId" TO "gatewayPaymentId";
ALTER INDEX "Order_razorpayOrderId_key" RENAME TO "Order_gatewayOrderId_key";

ALTER TABLE "Order" ADD COLUMN "paymentGateway" TEXT;
