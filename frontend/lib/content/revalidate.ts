import "server-only";
import { revalidatePath } from "next/cache";

/** Refreshes the cached marketing page after published content changes. */
export function revalidatePublicContent(): void {
  revalidatePath("/");
}
