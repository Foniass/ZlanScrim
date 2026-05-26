import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  type TournamentStatus,
  teamSizeLabel,
  tournamentStatusLabel,
  tournamentStatusVariant,
} from "@/lib/tournament";
import {
  cancelTournament,
  closeSignups,
  completeTournament,
  reopenSignups,
} from "@/app/actions/admin";
import { SignupsPanel } from "@/components/admin/signups-panel";
import { TeamsPanel } from "@/components/admin/teams-panel";
import { BracketPanel } from "@/components/admin/bracket-panel";

export const dynamic = "force-dynamic";

export default async function ManageTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) notFound();

  const status = tournament.status as TournamentStatus;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Tous les tournois
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tournament.name}
          </h1>
          {tournament.description ? (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {tournament.description}
            </p>
          ) : null}
          <div className="text-muted-foreground mt-2 text-sm">
            {teamSizeLabel(tournament.teamSize)}
          </div>
        </div>
        <Badge variant={tournamentStatusVariant[status]}>
          {tournamentStatusLabel[status]}
        </Badge>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {status === "SIGNUPS_OPEN" ? (
          <form
            action={async () => {
              "use server";
              await closeSignups(tournament.id);
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Fermer les inscriptions
            </Button>
          </form>
        ) : status === "SIGNUPS_CLOSED" ? (
          <form
            action={async () => {
              "use server";
              await reopenSignups(tournament.id);
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Rouvrir les inscriptions
            </Button>
          </form>
        ) : null}

        {status === "IN_PROGRESS" ? (
          <form
            action={async () => {
              "use server";
              await completeTournament(tournament.id);
            }}
          >
            <Button type="submit" variant="default" size="sm">
              Terminer le tournoi
            </Button>
          </form>
        ) : null}

        {(status === "SIGNUPS_OPEN" || status === "SIGNUPS_CLOSED") ? (
          <form
            action={async () => {
              "use server";
              await cancelTournament(tournament.id);
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Annuler le tournoi
            </Button>
          </form>
        ) : null}
      </div>

      <Tabs defaultValue="signups">
        <TabsList>
          <TabsTrigger value="signups">Inscriptions</TabsTrigger>
          <TabsTrigger value="teams">Équipes</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
        </TabsList>

        <TabsContent value="signups" className="pt-6">
          <SignupsPanel tournamentId={tournament.id} />
        </TabsContent>
        <TabsContent value="teams" className="pt-6">
          <TeamsPanel
            tournamentId={tournament.id}
            teamSize={tournament.teamSize}
            bracketLocked={status === "IN_PROGRESS" || status === "COMPLETED"}
          />
        </TabsContent>
        <TabsContent value="bracket" className="pt-6">
          <BracketPanel
            tournamentId={tournament.id}
            status={status}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
