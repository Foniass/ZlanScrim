import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export default async function Home() {
  const tournaments = await db.tournament.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: { select: { signups: true } },
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tournois</h1>
        <p className="text-muted-foreground mt-1">
          Inscrivez-vous au prochain événement
        </p>
      </header>

      {tournaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="text-muted-foreground h-10 w-10" />
            <p className="text-muted-foreground mt-4">
              Aucun tournoi pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => {
            const status = t.status as TournamentStatus;
            return (
              <Card key={t.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="leading-tight">{t.name}</CardTitle>
                    <Badge variant={tournamentStatusVariant[status]}>
                      {tournamentStatusLabel[status]}
                    </Badge>
                  </div>
                  {t.description ? (
                    <CardDescription className="line-clamp-2">
                      {t.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {teamSizeLabel(t.teamSize)}
                    </span>
                    <span>{t._count.signups} inscrits</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/tournois/${t.id}`}
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "w-full"
                    )}
                  >
                    {status === "SIGNUPS_OPEN" ? "S'inscrire" : "Voir"}
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
