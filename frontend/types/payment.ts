import type { PaymentProviderName, PaymentStatus } from "@/types/order";

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProviderName;
  providerPaymentId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedEvent {
  id: string;
  provider: PaymentProviderName;
  eventId: string;
  createdAt: string;
}
