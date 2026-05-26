import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type TournamentStatus,
  teamSizeLabel,
  tournamentStatusLabel,
  tournamentStatusVariant,
} from "@/lib/tournament";

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
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les tournois
          </p>
        </div>
        <Link
          href="/admin/tournois/nouveau"
          className={buttonVariants({ size: "default" })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouveau tournoi
        </Link>
      </header>

      {tournaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground mt-4">
              Aucun tournoi. Créez-en un pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tournaments.map((t) => {
            const status = t.status as TournamentStatus;
            return (
              <Link
                key={t.id}
                href={`/admin/tournois/${t.id}`}
                className={cn(
                  "block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold tracking-tight">{t.name}</h2>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
