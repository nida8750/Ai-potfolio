export type InquiryStatus = "new" | "in_progress" | "completed" | "closed";

export interface Inquiry {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  serviceId?: string;
  subject?: string;
  message: string;
  status: InquiryStatus;
  source: "contact" | "service_request";
  createdAt: string;
  updatedAt: string;
}
