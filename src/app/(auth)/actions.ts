"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    throw error;
  }
}

export async function registerAndSignIn(
  _prevState: string | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) {
    return "Email and password are required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  // bcrypt silently truncates at 72 bytes — reject longer passwords rather
  // than letting users believe more characters are being checked.
  if (password.length > 72) {
    return "Password must be at most 72 characters.";
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "An account with that email already exists.";
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name: name || null, hashedPassword },
  });

  try {
    // First login goes straight to profile onboarding — the AI mentor
    // needs the user's details before it can build or tailor anything.
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard/profile?welcome=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created. Please sign in.";
    }
    throw error;
  }
}
