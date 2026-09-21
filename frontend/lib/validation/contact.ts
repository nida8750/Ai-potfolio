import { z } from "zod";
import {
  emailSchema,
  emptyToUndefined,
  idSchema,
  messageSchema,
  nameSchema,
  phoneSchema,
} from "@/lib/validation/common";

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.transform(emptyToUndefined),
  serviceId: z.union([idSchema, z.literal("")]).optional().transform(emptyToUndefined),
  message: messageSchema,
});
