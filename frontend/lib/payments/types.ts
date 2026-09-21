import type { PaymentProviderName, PaymentStatus } from "@/types/order";

export interface CheckoutRequest {
  orderId: string;
  amount: number;
  currency: string;
  serviceTitle: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  provider: PaymentProviderName;
  providerOrderId: string;
  redirectUrl: string;
}

export interface VerifiedEvent {
  eventId: string;
  type: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: PaymentStatus;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<VerifiedEvent | null>;
  getPaymentStatus(providerOrderId: string): Promise<PaymentStatus>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult>;
}

export class PaymentConfigurationError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "PaymentConfigurationError";
  }

  static forProvider(provider: string): PaymentConfigurationError {
    return new PaymentConfigurationError(
      `${provider} is not configured. Add its credentials to enable checkout.`,
    );
  }
}
