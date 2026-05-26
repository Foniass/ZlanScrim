import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type TournamentStatus,
  teamSizeLabel,
  tournamentStatusLabel,
  tournamentStatusVariant,
} from "@/lib/tournament";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const tournaments = await db.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { signups: true, teams: true, rounds: true } },
    },
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Administration"
        subtitle="Créez et gérez les tournois"
        action={
          <Link
            href="/admin/tournois/nouveau"
            className={buttonVariants({ size: "default" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Nouveau tournoi
          </Link>
        }
      />

      {tournaments.length === 0 ? (
        <div className="bg-card ring-border flex flex-col items-center justify-center rounded-lg py-16 text-center ring-1">
          <Trophy className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground mt-4 text-sm">
            Aucun tournoi. Créez-en un pour commencer.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tournaments.map((t) => {
            const status = t.status as TournamentStatus;
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/tournois/${t.id}`}
                  className="group hover:bg-accent/40 hover:border-primary/30 ring-border block rounded-lg ring-1 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold tracking-tight">
                        {t.name}
                      </h2>
                      {t.description ? (
                        <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                          {t.description}
                        </p>
                      ) : null}
                      <div className="text-muted-foreground mt-2 flex gap-3 text-xs">
                        <span>{teamSizeLabel(t.teamSize)}</span>
                        <span>{t._count.signups} inscrits</span>
                        <span>{t._count.teams} équipes</span>
                        <span>{t._count.rounds} tours</span>
                      </div>
                    </div>
                    <Badge variant={tournamentStatusVariant[status]}>
                      {tournamentStatusLabel[status]}
                    </Badge>
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
