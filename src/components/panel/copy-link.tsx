"use client";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Mostra o link público e permite copiar — é isso que o dono coloca na bio do Instagram. */
export function CopyLink({ url }: { url: string }) {
  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado! Coloque na bio do Instagram e no WhatsApp.");
  }
  return (
    <Card className="flex flex-wrap items-center gap-3 border-primary/30 bg-primary/5 p-4">
      <Share2 className="size-5 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Seu link de agendamento</p>
        <p className="truncate font-medium">{url}</p>
      </div>
      <Button size="sm" onClick={copy}><Copy /> Copiar</Button>
    </Card>
  );
}
