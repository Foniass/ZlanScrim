import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  type SignupStatus,
  type TournamentStatus,
  signupStatusLabel,
  tournamentStatusLabel,
} from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const signups = await db.tournamentSignup.findMany({
    where: { userId: user.id },
    include: { tournament: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {user.name ?? "Mon profil"}
        </h1>
        {user.role === "ADMIN" ? (
          <Badge variant="secondary" className="mt-2">
            Administrateur
          </Badge>
        ) : null}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Mes inscriptions
        </h2>
        {signups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Vous n&apos;êtes inscrit à aucun tournoi pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {signups.map((s) => {
              const tStatus = s.tournament.status as TournamentStatus;
              const sStatus = s.status as SignupStatus;
              return (
                <Link
                  key={s.id}
                  href={`/tournois/${s.tournament.id}`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.tournament.name}</div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {tournamentStatusLabel[tStatus]}
                      </div>
                    </div>
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
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
