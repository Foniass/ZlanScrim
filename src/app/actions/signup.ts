"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/dal";

export async function signupForTournament(tournamentId: string) {
  const session = await getSession();
  if (!session?.user) {
    redirect(`/connexion?callbackUrl=/tournois/${tournamentId}`);
  }

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true },
  });
  if (!tournament) {
    return { error: "Tournoi introuvable." };
  }
  if (tournament.status !== "SIGNUPS_OPEN") {
    return { error: "Les inscriptions sont fermées." };
  }

  await db.tournamentSignup.upsert({
    where: {
      tournamentId_userId: { tournamentId, userId: session.user.id },
    },
    create: {
      tournamentId,
      userId: session.user.id,
      status: "PENDING",
    },
    update: {},
  });

  revalidatePath(`/tournois/${tournamentId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function withdrawFromTournament(tournamentId: string) {
  const session = await getSession();
  if (!session?.user) {
    redirect(`/connexion?callbackUrl=/tournois/${tournamentId}`);
  }

  const signup = await db.tournamentSignup.findUnique({
    where: {
      tournamentId_userId: { tournamentId, userId: session.user.id },
    },
    include: { tournament: { select: { status: true } } },
  });
  if (!signup) return { ok: true };

  // Only allow withdrawal while signups are still open.
  if (signup.tournament.status !== "SIGNUPS_OPEN") {
    return { error: "Trop tard pour se désinscrire." };
  }

  await db.tournamentSignup.delete({ where: { id: signup.id } });

  revalidatePath(`/tournois/${tournamentId}`);
  revalidatePath("/");
  return { ok: true };
}
