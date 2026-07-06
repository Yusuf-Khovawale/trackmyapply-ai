import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Shared by pages and server actions so every application query/mutation is
// scoped to the signed-in user the same way.
export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}
