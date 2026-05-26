/**
 * Single-elimination bracket generation.
 *
 * Given N seeded teams, produce a list of rounds, each with their matches.
 * Round 1 pairs by standard seeding: 1v8, 4v5, 3v6, 2v7 for 8 teams (so the
 * top seed faces progressively stronger opponents). Byes go to the highest
 * seeds in the first round.
 *
 * Matches are linked via nextMatchId/nextSlot so the result can be persisted
 * with two passes: create all matches with placeholder IDs, then resolve.
 */

export type GeneratedMatch = {
  /** Stable temporary id used only during generation to wire up next-match refs. */
  tmpId: string;
  roundIndex: number; // 0-based
  order: number; // position in the round (top to bottom)
  teamASeed: number | null; // 1-based seed; null = bye / TBD
  teamBSeed: number | null;
  nextTmpId: string | null;
  nextSlot: "A" | "B" | null;
};

export type GeneratedBracket = {
  rounds: { index: number; defaultName: string }[];
  matches: GeneratedMatch[];
};

/**
 * Standard single-elim seed order. For a 2^k bracket of size n, returns the
 * sequence of seeds for round 1 such that 1 plays the weakest, etc.
 * E.g. n=4 → [1,4,2,3]; n=8 → [1,8,4,5,2,7,3,6].
 */
function seedOrder(n: number): number[] {
  let order = [1, 2];
  while (order.length < n) {
    const next: number[] = [];
    const len = order.length * 2;
    for (const s of order) {
      next.push(s);
      next.push(len + 1 - s);
    }
    order = next;
  }
  return order;
}

function defaultRoundName(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIndex;
  if (fromEnd === 0) return "Finale";
  if (fromEnd === 1) return "Demi-finales";
  if (fromEnd === 2) return "Quarts de finale";
  return `Tour ${roundIndex + 1}`;
}

export function generateBracket(teamCount: number): GeneratedBracket {
  if (teamCount < 2) {
    throw new Error("Au moins 2 équipes sont nécessaires.");
  }

  // Pad to next power of 2 with byes (represented by null seed).
  const bracketSize = 2 ** Math.ceil(Math.log2(teamCount));
  const order = seedOrder(bracketSize);
  // Replace seeds > teamCount with null (byes).
  const slots: (number | null)[] = order.map((s) =>
    s <= teamCount ? s : null
  );

  const totalRounds = Math.log2(bracketSize);
  const rounds: GeneratedBracket["rounds"] = [];
  for (let i = 0; i < totalRounds; i++) {
    rounds.push({ index: i, defaultName: defaultRoundName(i, totalRounds) });
  }

  const matches: GeneratedMatch[] = [];
  // Build round 1 matches from the seed slot pairs.
  let prevRound: GeneratedMatch[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const m: GeneratedMatch = {
      tmpId: `r0m${i / 2}`,
      roundIndex: 0,
      order: i / 2,
      teamASeed: slots[i],
      teamBSeed: slots[i + 1],
      nextTmpId: null,
      nextSlot: null,
    };
    prevRound.push(m);
    matches.push(m);
  }

  // Subsequent rounds: half the matches each round, wired up.
  for (let r = 1; r < totalRounds; r++) {
    const thisRound: GeneratedMatch[] = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      const m: GeneratedMatch = {
        tmpId: `r${r}m${i / 2}`,
        roundIndex: r,
        order: i / 2,
        teamASeed: null,
        teamBSeed: null,
        nextTmpId: null,
        nextSlot: null,
      };
      thisRound.push(m);
      matches.push(m);
      prevRound[i].nextTmpId = m.tmpId;
      prevRound[i].nextSlot = "A";
      prevRound[i + 1].nextTmpId = m.tmpId;
      prevRound[i + 1].nextSlot = "B";
    }
    prevRound = thisRound;
  }

  return { rounds, matches };
}
