import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type SignupStatus,
  type TournamentStatus,
  teamSizeLabel,
  tournamentStatusLabel,
  tournamentStatusVariant,
} from "@/lib/tournament";
import {
  signupForTournament,
  withdrawFromTournament,
} from "@/app/actions/signup";
import { ParticipantView } from "@/components/participant-view";

export const dynamic = "force-dynamic";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { signups: true } },
      signups: session?.user
        ? {
            where: { userId: session.user.id },
            select: { status: true },
          }
        : false,
    },
  });

  if (!tournament) notFound();

  const status = tournament.status as TournamentStatus;
  const mySignupStatus = (tournament.signups?.[0]?.status ?? null) as
    | SignupStatus
    | null;
  const isAdmin = session?.user?.role === "ADMIN";
  const isAccepted = mySignupStatus === "ACCEPTED";
  const showParticipantView =
    isAdmin || isAccepted || status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Link
        href="/inscriptions"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="bg-card ring-border overflow-hidden rounded-lg ring-1">
        <div className="zlan-header px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {tournament.name}
              </h1>
              <div className="text-foreground/70 mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {teamSizeLabel(tournament.teamSize)}
                </span>
                <span>{tournament._count.signups} inscrits</span>
              </div>
            </div>
            <Badge variant={tournamentStatusVariant[status]}>
              {tournamentStatusLabel[status]}
            </Badge>
          </div>
        </div>
        {tournament.description ? (
          <div className="border-border border-t px-5 py-3">
            <p className="text-muted-foreground text-sm">
              {tournament.description}
            </p>
          </div>
        ) : null}
      </div>

      {showParticipantView ? (
        <ParticipantView tournamentId={tournament.id} isAdmin={isAdmin} />
      ) : (
        <SignupPanel
          tournamentId={tournament.id}
          status={status}
          mySignupStatus={mySignupStatus}
          loggedIn={!!session?.user}
        />
      )}
    </div>
  );
}

function SignupPanel({
  tournamentId,
  status,
  mySignupStatus,
  loggedIn,
}: {
  tournamentId: string;
  status: TournamentStatus;
  mySignupStatus: SignupStatus | null;
  loggedIn: boolean;
}) {
  if (mySignupStatus === "PENDING") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inscription en attente</CardTitle>
          <CardDescription>
            L&apos;organisateur examine les inscriptions. Vous serez notifié
            lorsque la décision sera prise.
          </CardDescription>
        </CardHeader>
        {status === "SIGNUPS_OPEN" ? (
          <CardContent>
            <form
              action={async () => {
                "use server";
                await withdrawFromTournament(tournamentId);
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Annuler mon inscription
              </Button>
            </form>
          </CardContent>
        ) : null}
      </Card>
    );
  }

  if (mySignupStatus === "REJECTED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inscription refusée</CardTitle>
          <CardDescription>
            Vous ne participerez pas à ce tournoi.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status !== "SIGNUPS_OPEN") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {status === "CANCELLED"
              ? "Tournoi annulé"
              : "Inscriptions fermées"}
          </CardTitle>
          <CardDescription>
            {status === "CANCELLED"
              ? "Ce tournoi n'aura pas lieu."
              : "Les détails du tournoi sont réservés aux participants."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rejoindre le tournoi</CardTitle>
        <CardDescription>
          Inscrivez-vous pour participer. L&apos;organisateur validera votre
          place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async () => {
            "use server";
            await signupForTournament(tournamentId);
          }}
        >
          <Button type="submit" size="lg">
            {loggedIn ? "S'inscrire" : "Se connecter pour s'inscrire"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
