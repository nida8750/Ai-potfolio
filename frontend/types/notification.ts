export type NotificationType =
  | "INQUIRY_RECEIVED"
  | "ORDER_CREATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ORDER_UPDATED"
  | "ADMIN_ALERT";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
