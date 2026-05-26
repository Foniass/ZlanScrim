import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const getSession = cache(async () => {
  return await auth();
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session?.user) {
    redirect("/connexion");
  }
  return session.user;
});

export const requireAdmin = cache(async () => {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
});
