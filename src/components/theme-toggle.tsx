"use client";
// Alterna entre modo claro e escuro e lembra a escolha no navegador.
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema claro/escuro">
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  );
}

// Script que roda ANTES da página aparecer, para não "piscar" branco no modo escuro.
// Usa a escolha salva ou, se não houver, a preferência do sistema.
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;
