import Link from "next/link";
import { Trophy } from "lucide-react";
import { getSession } from "@/lib/dal";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Trophy className="h-5 w-5" />
          ZlanScrim
        </Link>

        <nav className="flex items-center gap-2">
          {session?.user ? (
            <UserMenu
              name={session.user.name}
              image={session.user.image}
              role={session.user.role}
            />
          ) : (
            <Link
              href="/connexion"
              className={buttonVariants({ size: "sm", variant: "default" })}
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
