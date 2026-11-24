// =============================================================================
// Autenticação (Auth.js / NextAuth v5)
//
// - Login com e-mail e senha (Credentials)
// - Login com Google (ativado automaticamente se AUTH_GOOGLE_ID estiver no .env)
// A sessão fica num cookie criptografado (JWT) — não precisa de tabela de sessão.
// =============================================================================
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { loginSchema } from "@/server/validators";
import { rateLimit } from "@/server/rate-limit";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  trustHost: true,
  providers: [
    ...(googleEnabled ? [Google] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Máximo de 10 tentativas por e-mail a cada 15 minutos (contra força bruta)
        try {
          rateLimit(`login:${email}`, 10, 15 * 60_000);
        } catch {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        // Comparamos o hash; a senha real NUNCA é guardada no banco.
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    // No primeiro login com Google, criamos o usuário no nosso banco.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        await db.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: {},
          create: { email: user.email.toLowerCase(), name: user.name ?? "Usuário", image: user.image },
        });
      }
      return true;
    },
    // Guardamos o id do NOSSO banco dentro do token da sessão.
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await db.user.findUnique({ where: { email: user.email!.toLowerCase() } });
          token.uid = dbUser?.id;
        } else {
          token.uid = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
});
