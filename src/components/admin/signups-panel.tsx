import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { signupStatusLabel, type SignupStatus } from "@/lib/tournament";
import { setSignupStatus } from "@/app/actions/admin";

export async function SignupsPanel({ tournamentId }: { tournamentId: string }) {
  const signups = await db.tournamentSignup.findMany({
    where: { tournamentId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  if (signups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Aucune inscription pour le moment.
        </CardContent>
      </Card>
    );
  }

  const counts = signups.reduce<Record<SignupStatus, number>>(
    (acc, s) => {
      acc[s.status as SignupStatus] += 1;
      return acc;
    },
    { PENDING: 0, ACCEPTED: 0, REJECTED: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscriptions ({signups.length})</CardTitle>
        <CardDescription>
          {counts.PENDING} en attente · {counts.ACCEPTED} accepté
          {counts.ACCEPTED > 1 ? "s" : ""} · {counts.REJECTED} refusé
          {counts.REJECTED > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Joueur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signups.map((s) => {
              const status = s.status as SignupStatus;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.user.name ?? s.user.email ?? "Anonyme"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status === "ACCEPTED"
                          ? "default"
                          : status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {signupStatusLabel[status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {status !== "ACCEPTED" ? (
                        <form
                          action={async () => {
                            "use server";
                            await setSignupStatus(s.id, "ACCEPTED");
                          }}
                        >
                          <Button type="submit" size="xs" variant="outline">
                            Accepter
                          </Button>
                        </form>
                      ) : null}
                      {status !== "REJECTED" ? (
                        <form
                          action={async () => {
                            "use server";
                            await setSignupStatus(s.id, "REJECTED");
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            variant="destructive"
                          >
                            Refuser
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
