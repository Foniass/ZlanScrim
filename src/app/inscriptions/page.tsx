import Link from "next/link";
import { Trophy, Users, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/dal";
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

export default async function InscriptionsPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const tournaments = await db.tournament.findMany({
    where: {
      status: { in: ["SIGNUPS_OPEN", "SIGNUPS_CLOSED"] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { signups: true } },
      signups: userId
        ? {
            where: { userId },
            select: { status: true },
          }
        : false,
    },
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Inscriptions"
        subtitle="Tournois ouverts aux inscriptions"
      />

      {tournaments.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {tournaments.map((t) => {
            const status = t.status as TournamentStatus;
            const mySignup = (t.signups?.[0]?.status ?? null) as
              | SignupStatus
              | null;
            return (
              <li key={t.id}>
                <Link
                  href={`/tournois/${t.id}`}
                  className="group hover:bg-accent/40 hover:border-primary/30 ring-border block rounded-lg ring-1 transition-colors"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="bg-secondary/30 text-neon flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold tracking-tight">
                          {t.name}
                        </h3>
                        <Badge variant={tournamentStatusVariant[status]}>
                          {tournamentStatusLabel[status]}
                        </Badge>
                        {mySignup ? (
                          <Badge
                            variant={
                              mySignup === "ACCEPTED"
                                ? "default"
                                : mySignup === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {signupStatusLabel[mySignup]}
                          </Badge>
                        ) : null}
                      </div>
                      {t.description ? (
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
                          {t.description}
                        </p>
                      ) : null}
                      <div className="text-muted-foreground mt-1.5 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {teamSizeLabel(t.teamSize)}
                        </span>
                        <span>{t._count.signups} inscrits</span>
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

      {!session?.user ? (
        <div className="bg-card ring-border rounded-lg p-4 text-sm ring-1">
          <p className="text-muted-foreground">
            Connectez-vous pour vous inscrire à un tournoi.
          </p>
          <Link
            href="/connexion"
            className={cn(
              buttonVariants({ size: "sm", variant: "default" }),
              "mt-3"
            )}
          >
            Se connecter avec Discord
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card ring-border flex flex-col items-center justify-center rounded-lg py-16 text-center ring-1">
      <Trophy className="text-muted-foreground h-10 w-10" />
      <p className="text-muted-foreground mt-4 text-sm">
        Aucun tournoi ouvert aux inscriptions pour le moment.
      </p>
    </div>
  );
}
