import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="mt-2 text-xl font-semibold">Página não encontrada</h1>
        <p className="text-muted-foreground">Confira se o link está correto.</p>
        <Button asChild className="mt-6"><Link href="/">Voltar ao início</Link></Button>
      </div>
    </div>
  );
}
