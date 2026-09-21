export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentProviderName = "stripe" | "paypal";

export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentProvider?: PaymentProviderName;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  providerOrderId?: string;
  providerPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}
