"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Scissors, Users, CalendarOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/painel", label: "Agenda", icon: CalendarDays },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/profissionais", label: "Equipe", icon: Users },
  { href: "/painel/bloqueios", label: "Folgas", icon: CalendarOff },
  { href: "/painel/configuracoes", label: "Ajustes", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/painel" ? pathname === href : pathname.startsWith(href);
}

/** Menu lateral (computador) */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(pathname, href) && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
          )}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior (celular): fácil de alcançar com o polegar */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground",
            isActive(pathname, href) && "text-primary",
          )}
        >
          <Icon className="size-5" /> {label}
        </Link>
      ))}
    </nav>
  );
}
