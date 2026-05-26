import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Discord from "next-auth/providers/discord";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Discord],
  session: { strategy: "database" },
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = ((user as { role?: string }).role ?? "USER") as
        | "USER"
        | "ADMIN";
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Auto-promote configured Discord ID to ADMIN on every sign-in.
      // (Cheap, idempotent — keeps admin if a manual DB edit reset it.)
      const adminDiscordId = process.env.ADMIN_DISCORD_ID;
      if (
        adminDiscordId &&
        account?.provider === "discord" &&
        account.providerAccountId === adminDiscordId &&
        user.id
      ) {
        await db.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});
