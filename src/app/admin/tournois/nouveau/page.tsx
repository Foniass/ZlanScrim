import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTournamentForm } from "@/components/admin/create-tournament-form";

export default async function NewTournamentPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau tournoi</CardTitle>
          <CardDescription>
            Vous configurerez les jeux et les équipes après la création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTournamentForm />
        </CardContent>
      </Card>
    </div>
  );
}
