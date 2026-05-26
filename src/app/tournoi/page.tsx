import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type SignupStatus,
  type TournamentStatus,
  signupStatusLabel,
  teamSizeLabel,
  tournamentStatusLabel,
  tournamentStatusVariant,
} from "@/lib/tournament";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

export default async function TournoiPage() {
  const user = await requireUser();

  const signups = await db.tournamentSignup.findMany({
    where: { userId: user.id },
    include: {
      tournament: {
        include: { _count: { select: { signups: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort: in-progress first, then accepted-but-pending tournaments, then others.
  const ordered = [...signups].sort((a, b) => {
    const ord = (s: typeof a) => {
      const ts = s.tournament.status;
      if (ts === "IN_PROGRESS") return 0;
      if (ts === "SIGNUPS_OPEN" || ts === "SIGNUPS_CLOSED") return 1;
      if (ts === "COMPLETED") return 2;
      return 3;
    };
    return ord(a) - ord(b);
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mes tournois"
        subtitle="Tournois auxquels vous participez ou vous êtes inscrit"
      />

      {ordered.length === 0 ? (
        <div className="bg-card ring-border flex flex-col items-center justify-center rounded-lg py-16 text-center ring-1">
          <Trophy className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground mt-4 text-sm">
            Vous n&apos;êtes inscrit à aucun tournoi.
          </p>
          <Link
            href="/inscriptions"
            className={cn(
              buttonVariants({ size: "sm", variant: "default" }),
              "mt-4"
            )}
          >
            Voir les inscriptions ouvertes
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {ordered.map((s) => {
            const tStatus = s.tournament.status as TournamentStatus;
            const sStatus = s.status as SignupStatus;
            return (
              <li key={s.id}>
                <Link
                  href={`/tournois/${s.tournament.id}`}
                  className="group hover:bg-accent/40 hover:border-primary/30 ring-border block rounded-lg ring-1 transition-colors"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="bg-secondary/30 text-neon flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold tracking-tight">
                          {s.tournament.name}
                        </h3>
                        <Badge variant={tournamentStatusVariant[tStatus]}>
                          {tournamentStatusLabel[tStatus]}
                        </Badge>
                        <Badge
                          variant={
                            sStatus === "ACCEPTED"
                              ? "default"
                              : sStatus === "REJECTED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {signupStatusLabel[sStatus]}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1.5 flex items-center gap-4 text-xs">
                        <span>{teamSizeLabel(s.tournament.teamSize)}</span>
                        <span>
                          {s.tournament._count.signups} inscrits
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
