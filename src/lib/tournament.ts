export type TournamentStatus =
  | "SIGNUPS_OPEN"
  | "SIGNUPS_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type SignupStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type RoundStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type MatchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export const tournamentStatusLabel: Record<TournamentStatus, string> = {
  SIGNUPS_OPEN: "Inscriptions ouvertes",
  SIGNUPS_CLOSED: "Inscriptions fermées",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export const tournamentStatusVariant: Record<
  TournamentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SIGNUPS_OPEN: "default",
  SIGNUPS_CLOSED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export const signupStatusLabel: Record<SignupStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
};

export function teamSizeLabel(size: number): string {
  if (size === 1) return "Solo";
  if (size === 2) return "Duos";
  if (size === 3) return "Trios";
  return `${size}v${size}`;
}
