export interface PlatformSettings {
  id: "platform";
  defaultCurrency: string;
  paymentProvider: "stripe" | "paypal" | "none";
  bookingsEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}
