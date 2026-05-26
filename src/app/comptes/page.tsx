import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

export default async function ComptesPage() {
  const user = await requireUser();

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { provider: true, providerAccountId: true },
  });
  const discord = accounts.find((a) => a.provider === "discord");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Comptes liés"
        subtitle="Connectez vos plateformes pour faciliter le déroulé des tournois"
      />

      <div className="bg-card ring-border overflow-hidden rounded-lg ring-1">
        <div className="zlan-header px-4 py-3">
          <h2 className="text-neon text-sm font-bold tracking-wider uppercase">
            Plateformes
          </h2>
        </div>
        <div className="divide-border divide-y p-1">
          <AccountRow
            name="Discord"
            connected={!!discord}
            handle={user.name ?? null}
            icon={<DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
          />
          <AccountRow
            name="Steam"
            connected={false}
            handle={null}
            icon={<SteamIcon className="text-muted-foreground h-5 w-5" />}
            comingSoon
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Discord est utilisé pour la connexion. Vous serez notifié des décisions
        d&apos;inscription via votre compte Discord.
      </p>
    </div>
  );
}

function AccountRow({
  name,
  connected,
  handle,
  icon,
  comingSoon,
}: {
  name: string;
  connected: boolean;
  handle: string | null;
  icon: React.ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div className="hover:bg-accent/30 flex items-center gap-3 rounded-md px-3 py-3 transition-colors">
      <div className="bg-background ring-border flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{name}</div>
        {handle ? (
          <div className="text-muted-foreground text-xs">{handle}</div>
        ) : comingSoon ? (
          <div className="text-muted-foreground text-xs">Bientôt disponible</div>
        ) : (
          <div className="text-muted-foreground text-xs">Non connecté</div>
        )}
      </div>
      {connected ? (
        <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          OK
        </Badge>
      ) : comingSoon ? (
        <Badge variant="outline">Bientôt</Badge>
      ) : (
        <Badge variant="secondary">Non lié</Badge>
      )}
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03Z" />
    </svg>
  );
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.955.4 1.405 1.5 1.005 2.455-.397.957-1.497 1.41-2.451 1.012zM17.842 8.91c0-1.66-1.353-3.012-3.015-3.012-1.661 0-3.012 1.352-3.012 3.012 0 1.66 1.351 3.01 3.012 3.01 1.662 0 3.015-1.35 3.015-3.01zm-5.273-.005c0-1.247 1.014-2.260 2.265-2.260 1.249 0 2.262 1.013 2.262 2.260 0 1.249-1.013 2.260-2.262 2.260-1.251 0-2.265-1.011-2.265-2.260z" />
    </svg>
  );
}
