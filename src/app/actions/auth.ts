"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithDiscord(redirectTo: string = "/") {
  await signIn("discord", { redirectTo });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
