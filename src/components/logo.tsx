import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 text-lg font-bold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <CalendarCheck className="size-5" />
      </span>
      Agendaí
    </Link>
  );
}
