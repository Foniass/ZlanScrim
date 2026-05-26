import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTeamForm } from "@/components/admin/create-team-form";
import { deleteTeam } from "@/app/actions/admin";

export async function TeamsPanel({
  tournamentId,
  teamSize,
  bracketLocked,
}: {
  tournamentId: string;
  teamSize: number;
  bracketLocked: boolean;
}) {
  const [teams, acceptedSignups] = await Promise.all([
    db.team.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { seed: "asc" },
    }),
    db.tournamentSignup.findMany({
      where: { tournamentId, status: "ACCEPTED" },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  // Users not yet on a team in this tournament.
  const onTeamUserIds = new Set(
    teams.flatMap((t) => t.members.map((m) => m.userId))
  );
  const availablePlayers = acceptedSignups
    .filter((s) => !onTeamUserIds.has(s.userId))
    .map((s) => ({
      id: s.user.id,
      name: s.user.name ?? "Anonyme",
    }));

  return (
    <div className="space-y-6">
      {!bracketLocked ? (
        <Card>
          <CardHeader>
            <CardTitle>Créer une équipe</CardTitle>
            <CardDescription>
              Sélectionnez {teamSize} joueur{teamSize > 1 ? "s" : ""} parmi les
              inscrits acceptés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availablePlayers.length < teamSize ? (
              <p className="text-muted-foreground text-sm">
                Pas assez de joueurs acceptés sans équipe (
                {availablePlayers.length}/{teamSize}).
              </p>
            ) : (
              <CreateTeamForm
                tournamentId={tournamentId}
                teamSize={teamSize}
                availablePlayers={availablePlayers}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">
          Équipes ({teams.length})
        </h3>
        {teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune équipe.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {t.seed ? (
                      <span className="text-muted-foreground text-xs">
                        #{t.seed}
                      </span>
                    ) : null}
                    {t.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm">
                    {t.members.map((m) => (
                      <li key={m.id}>{m.user.name ?? "Anonyme"}</li>
                    ))}
                  </ul>
                  {!bracketLocked ? (
                    <form
                      action={async () => {
                        "use server";
                        await deleteTeam(t.id);
                      }}
                    >
                      <Button type="submit" variant="ghost" size="xs">
                        Supprimer
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
