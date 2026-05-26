"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ListChecks, Link2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If true, item is shown but clicking goes to /connexion. */
  authRequired?: boolean;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

const baseSections: SidebarSection[] = [
  {
    title: "Espace joueur",
    items: [
      {
        label: "Tournoi",
        href: "/tournoi",
        icon: Trophy,
        authRequired: true,
      },
      { label: "Inscriptions", href: "/inscriptions", icon: ListChecks },
      {
        label: "Comptes liés",
        href: "/comptes",
        icon: Link2,
        authRequired: true,
      },
    ],
  },
];

const adminSection: SidebarSection = {
  title: "Administration",
  items: [
    { label: "Tournois", href: "/admin", icon: ShieldCheck },
  ],
};

export function SiteSidebar({
  isAdmin,
  isLoggedIn,
}: {
  isAdmin: boolean;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const sections = isAdmin ? [...baseSections, adminSection] : baseSections;

  // Hide sidebar entirely on the connexion page to reduce noise.
  if (pathname === "/connexion") return null;

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 lg:flex">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-muted-foreground mb-2 px-3 text-[10px] font-semibold tracking-widest uppercase">
            {section.title}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              const href =
                item.authRequired && !isLoggedIn
                  ? `/connexion?callbackUrl=${encodeURIComponent(item.href)}`
                  : item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    className={cn(
                      "group/sidebar-link relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {active ? (
                      <span className="bg-primary absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r" />
                    ) : null}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // /admin matches /admin and /admin/anything (so the tab stays highlighted inside subroutes).
  return pathname === href || pathname.startsWith(href + "/");
}
