import Link from "next/link";
import { getSession } from "@/lib/dal";
import { UserMenu } from "@/components/user-menu";
import { SiteSidebar } from "@/components/site-sidebar";
import { buttonVariants } from "@/components/ui/button";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="border-sidebar-border bg-sidebar/80 supports-[backdrop-filter]:bg-sidebar/60 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 lg:px-6">
          <Link
            href="/"
            className="text-neon flex items-baseline gap-0 text-xl font-black tracking-tight"
          >
            <span>ZLAN</span>
            <span className="text-foreground text-base font-semibold">Scrim</span>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <UserMenu name={user.name} image={user.image} role={user.role} />
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

      {/* Body: sidebar + content */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0 px-0 lg:gap-6 lg:px-6 lg:py-6">
        <SiteSidebar
          isAdmin={user?.role === "ADMIN"}
          isLoggedIn={!!user}
        />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-0 lg:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
