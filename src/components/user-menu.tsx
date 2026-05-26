"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  image,
  role,
}: {
  name?: string | null;
  image?: string | null;
  role: "USER" | "ADMIN";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 px-2"
        )}
      >
        <Avatar className="size-7">
          {image ? <AvatarImage src={image} alt={name ?? ""} /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm sm:inline">{name ?? "Compte"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{name ?? "Connecté"}</div>
          {role === "ADMIN" ? (
            <div className="text-muted-foreground text-xs">Administrateur</div>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === "ADMIN" ? (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <Settings className="mr-2 h-4 w-4" />
            Administration
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => router.push("/profil")}>
          <UserIcon className="mr-2 h-4 w-4" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={() => startTransition(() => signOutAction())}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {pending ? "Déconnexion..." : "Se déconnecter"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
