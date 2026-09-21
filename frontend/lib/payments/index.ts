import "server-only";
import { env } from "@/lib/env";
import { paypalProvider } from "@/lib/payments/paypal";
import { stripeProvider } from "@/lib/payments/stripe";
import { PaymentConfigurationError } from "@/lib/payments/types";
import type { PaymentProvider } from "@/lib/payments/types";
import type { PaymentProviderName } from "@/types/order";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
};

export function getProvider(name: PaymentProviderName): PaymentProvider {
  return providers[name];
}

export function configuredProviders(): PaymentProviderName[] {
  return (Object.keys(providers) as PaymentProviderName[]).filter((name) =>
    providers[name].isConfigured(),
  );
}

/**
 * Resolves the provider a checkout should use. `PAYMENT_PROVIDER` pins one
 * explicitly; otherwise the single configured provider is used. Payments stay
 * disabled until credentials exist, because no provider is available in every
 * country.
 */
export function resolveProvider(preferred?: PaymentProviderName): PaymentProvider {
  const available = configuredProviders();

  if (preferred) {
    if (!available.includes(preferred)) {
      throw new PaymentConfigurationError(preferred);
    }
    return providers[preferred];
  }

  if (env.paymentProvider !== "none") {
    if (!available.includes(env.paymentProvider)) {
      throw new PaymentConfigurationError(env.paymentProvider);
    }
    return providers[env.paymentProvider];
  }

  if (available.length === 1) {
    return providers[available[0]];
  }

  throw new PaymentConfigurationError(
    available.length === 0 ? "No payment provider" : "PAYMENT_PROVIDER",
  );
}

export function paymentsEnabled(): boolean {
  return configuredProviders().length > 0;
}

export { PaymentConfigurationError };
export type { PaymentProvider };
