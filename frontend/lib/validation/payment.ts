import { z } from "zod";
import { idSchema } from "@/lib/validation/common";

export const createOrderSchema = z.object({
  serviceId: idSchema,
});

export const refundSchema = z.object({
  paymentId: idSchema,
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
});
