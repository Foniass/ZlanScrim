"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { generateBracket } from "@/lib/bracket";
import type { Prisma } from "@prisma/client";

// ────────────── Tournament lifecycle ──────────────

const createTournamentSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  description: z.string().trim().max(2000).optional(),
  teamSize: z.coerce.number().int().min(1).max(10),
});

export async function createTournament(formData: FormData) {
  await requireAdmin();

  const parsed = createTournamentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    teamSize: formData.get("teamSize"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const admin = await requireAdmin();
  const tournament = await db.tournament.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      teamSize: parsed.data.teamSize,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/tournois/${tournament.id}`);
}

export async function closeSignups(tournamentId: string) {
  await requireAdmin();
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "SIGNUPS_CLOSED" },
  });
  revalidatePath(`/admin/tournois/${tournamentId}`);
  revalidatePath(`/tournois/${tournamentId}`);
}

export async function reopenSignups(tournamentId: string) {
  await requireAdmin();
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "SIGNUPS_OPEN" },
  });
  revalidatePath(`/admin/tournois/${tournamentId}`);
  revalidatePath(`/tournois/${tournamentId}`);
}

export async function completeTournament(tournamentId: string) {
  await requireAdmin();
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });
  revalidatePath(`/admin/tournois/${tournamentId}`);
  revalidatePath(`/tournois/${tournamentId}`);
  revalidatePath("/");
}

export async function cancelTournament(tournamentId: string) {
  await requireAdmin();
  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/admin/tournois/${tournamentId}`);
  revalidatePath(`/tournois/${tournamentId}`);
  revalidatePath("/");
}

export async function deleteTournament(tournamentId: string) {
  await requireAdmin();
  await db.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

// ────────────── Signups ──────────────

export async function setSignupStatus(
  signupId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED"
) {
  await requireAdmin();
  const signup = await db.tournamentSignup.update({
    where: { id: signupId },
    data: { status },
    select: { tournamentId: true },
  });
  revalidatePath(`/admin/tournois/${signup.tournamentId}`);
  revalidatePath(`/tournois/${signup.tournamentId}`);
}

// ────────────── Teams ──────────────

const createTeamSchema = z.object({
  tournamentId: z.string(),
  name: z.string().trim().min(1, "Nom requis").max(60),
  memberIds: z.array(z.string()).min(1, "Au moins un membre"),
});

export async function createTeam(formData: FormData) {
  await requireAdmin();

  const parsed = createTeamSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    memberIds: formData.getAll("memberIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { tournamentId, name, memberIds } = parsed.data;

  // Verify all members are accepted signups for this tournament.
  const accepted = await db.tournamentSignup.findMany({
    where: {
      tournamentId,
      userId: { in: memberIds },
      status: "ACCEPTED",
    },
    select: { userId: true },
  });
  if (accepted.length !== memberIds.length) {
    return { error: "Tous les membres doivent être inscrits et acceptés." };
  }

  // Make sure none are already on another team for this tournament.
  const existingMembers = await db.teamMember.findMany({
    where: {
      userId: { in: memberIds },
      team: { tournamentId },
    },
    select: { userId: true },
  });
  if (existingMembers.length > 0) {
    return { error: "Certains joueurs sont déjà dans une équipe." };
  }

  await db.team.create({
    data: {
      tournamentId,
      name,
      members: { create: memberIds.map((userId) => ({ userId })) },
    },
  });

  revalidatePath(`/admin/tournois/${tournamentId}`);
}

export async function deleteTeam(teamId: string) {
  await requireAdmin();
  const team = await db.team.delete({
    where: { id: teamId },
    select: { tournamentId: true },
  });
  revalidatePath(`/admin/tournois/${team.tournamentId}`);
}

// ────────────── Bracket generation ──────────────

const generateBracketSchema = z.object({
  tournamentId: z.string(),
  // gameNames length must equal number of rounds (log2 of next power of 2).
  gameNames: z.array(z.string().trim().min(1, "Jeu requis").max(60)),
});

export async function generateBracketForTournament(formData: FormData) {
  await requireAdmin();

  const parsed = generateBracketSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    gameNames: formData.getAll("gameNames"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { tournamentId, gameNames } = parsed.data;

  const teams = await db.team.findMany({
    where: { tournamentId },
    orderBy: { seed: "asc" },
  });

  if (teams.length < 2) {
    return { error: "Au moins 2 équipes sont nécessaires." };
  }

  const bracket = generateBracket(teams.length);

  if (gameNames.length !== bracket.rounds.length) {
    return {
      error: `${bracket.rounds.length} jeu(x) attendu(s) pour le bracket, ${gameNames.length} reçu(s).`,
    };
  }

  // Seed assignment: assign seed 1..N to teams in their current sort order
  // (or by existing seed if they already have one).
  const seededTeams = teams.map((t, i) => ({
    ...t,
    seed: t.seed ?? i + 1,
  }));
  const seedToTeamId = new Map<number, string>();
  seededTeams.forEach((t) => seedToTeamId.set(t.seed, t.id));

  // Run everything inside a transaction so partial bracket creation can't
  // leave the tournament in a half-built state.
  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // Wipe any existing rounds/matches (in case the admin regenerates).
    await tx.match.deleteMany({ where: { round: { tournamentId } } });
    await tx.round.deleteMany({ where: { tournamentId } });

    // Update seeds.
    for (const t of seededTeams) {
      await tx.team.update({
        where: { id: t.id },
        data: { seed: t.seed },
      });
    }

    // Create rounds.
    const roundIds = new Map<number, string>();
    for (const r of bracket.rounds) {
      const created = await tx.round.create({
        data: {
          tournamentId,
          order: r.index + 1,
          name: r.defaultName,
          gameName: gameNames[r.index],
        },
      });
      roundIds.set(r.index, created.id);
    }

    // First pass: create all matches without nextMatch wiring.
    const matchIdByTmp = new Map<string, string>();
    for (const m of bracket.matches) {
      const teamAId = m.teamASeed
        ? (seedToTeamId.get(m.teamASeed) ?? null)
        : null;
      const teamBId = m.teamBSeed
        ? (seedToTeamId.get(m.teamBSeed) ?? null)
        : null;
      // If a side is a bye (one team null and one set), pre-resolve the winner
      // so the bye team auto-advances. If both are null, leave pending.
      let winnerId: string | null = null;
      let status: "PENDING" | "COMPLETED" = "PENDING";
      if (teamAId && !teamBId && m.teamBSeed === null) {
        winnerId = teamAId;
        status = "COMPLETED";
      } else if (teamBId && !teamAId && m.teamASeed === null) {
        winnerId = teamBId;
        status = "COMPLETED";
      }
      const created = await tx.match.create({
        data: {
          roundId: roundIds.get(m.roundIndex)!,
          order: m.order,
          teamAId,
          teamBId,
          winnerId,
          status,
        },
      });
      matchIdByTmp.set(m.tmpId, created.id);
    }

    // Second pass: wire up nextMatch + slot, and propagate any bye winners.
    for (const m of bracket.matches) {
      if (!m.nextTmpId) continue;
      const matchId = matchIdByTmp.get(m.tmpId)!;
      const nextId = matchIdByTmp.get(m.nextTmpId)!;
      await tx.match.update({
        where: { id: matchId },
        data: { nextMatchId: nextId, nextSlot: m.nextSlot },
      });

      // If this match has a pre-resolved winner (bye), propagate to next now.
      const thisMatch = await tx.match.findUnique({
        where: { id: matchId },
        select: { winnerId: true },
      });
      if (thisMatch?.winnerId) {
        await tx.match.update({
          where: { id: nextId },
          data:
            m.nextSlot === "A"
              ? { teamAId: thisMatch.winnerId }
              : { teamBId: thisMatch.winnerId },
        });
      }
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: "IN_PROGRESS", startsAt: new Date() },
    });
  });

  revalidatePath(`/admin/tournois/${tournamentId}`);
  revalidatePath(`/tournois/${tournamentId}`);
  revalidatePath("/");
}

// ────────────── Match results ──────────────

const recordResultSchema = z.object({
  matchId: z.string(),
  scoreA: z.coerce.number().int().min(0),
  scoreB: z.coerce.number().int().min(0),
});

export async function recordMatchResult(formData: FormData) {
  await requireAdmin();

  const parsed = recordResultSchema.safeParse({
    matchId: formData.get("matchId"),
    scoreA: formData.get("scoreA"),
    scoreB: formData.get("scoreB"),
  });

  if (!parsed.success) {
    return { error: "Scores invalides." };
  }

  const { matchId, scoreA, scoreB } = parsed.data;

  if (scoreA === scoreB) {
    return { error: "Pas d'égalité en bracket — il faut un vainqueur." };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      teamAId: true,
      teamBId: true,
      nextMatchId: true,
      nextSlot: true,
      round: { select: { tournamentId: true } },
    },
  });
  if (!match) return { error: "Match introuvable." };
  if (!match.teamAId || !match.teamBId) {
    return { error: "Les deux équipes doivent être assignées." };
  }

  const winnerId = scoreA > scoreB ? match.teamAId : match.teamBId;

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        scoreA,
        scoreB,
        winnerId,
        status: "COMPLETED",
      },
    });

    // Propagate winner to next match's slot.
    if (match.nextMatchId && match.nextSlot) {
      await tx.match.update({
        where: { id: match.nextMatchId },
        data:
          match.nextSlot === "A"
            ? { teamAId: winnerId }
            : { teamBId: winnerId },
      });
    }
  });

  revalidatePath(`/admin/tournois/${match.round.tournamentId}`);
  revalidatePath(`/tournois/${match.round.tournamentId}`);
}

export async function updateRoundGame(roundId: string, gameName: string) {
  await requireAdmin();
  const round = await db.round.update({
    where: { id: roundId },
    data: { gameName: gameName.trim() },
    select: { tournamentId: true },
  });
  revalidatePath(`/admin/tournois/${round.tournamentId}`);
  revalidatePath(`/tournois/${round.tournamentId}`);
}
