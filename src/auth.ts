import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Lazily-created hash of a random value, used to equalize timing when a
// sign-in attempt targets an email that has no account.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash(
    `timing-equalizer-${Math.random()}`,
    12,
  );
  return dummyHashPromise;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // The Credentials provider does not support Auth.js's database session
  // strategy, so sessions are JWT-based even though the Prisma adapter is
  // configured (kept for a future OAuth provider — see docs/architecture.md).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        // bcrypt silently truncates input at 72 bytes; cap it so an
        // attacker can't feed multi-megabyte "passwords" into the hash.
        if (password.length === 0 || password.length > 72) {
          return null;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Always run one bcrypt comparison, even when the account doesn't
        // exist, so response timing doesn't reveal which emails are
        // registered (user enumeration via timing).
        const hashToCheck =
          user?.hashedPassword ?? (await getDummyHash());
        const isValid = await bcrypt.compare(password, hashToCheck);

        if (!isValid || !user?.hashedPassword) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
