// =============================================================================
// Dados de demonstração. Rode com:  npm run db:seed
// Cria a "Barbearia Demo" com login demo@agendai.com / senha: demo12345
// =============================================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "demo@agendai.com";
  await db.business.deleteMany({ where: { slug: "barbearia-demo" } });
  await db.user.deleteMany({ where: { email } });

  const user = await db.user.create({
    data: { name: "João Demo", email, passwordHash: await bcrypt.hash("demo12345", 12) },
  });

  const business = await db.business.create({
    data: {
      slug: "barbearia-demo",
      name: "Barbearia Demo",
      category: "Barbearia",
      description: "Cortes clássicos e modernos, barba na toalha quente e um bom café.",
      primaryColor: "#b45309",
      phone: "11999998888",
      address: "Rua das Flores, 123 - Centro",
      city: "São Paulo - SP",
      plan: "PRO", // PRO para a demo poder ter 2 profissionais
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  const services = await Promise.all(
    [
      { name: "Corte de cabelo", durationMin: 30, priceCents: 4500, paymentPolicy: "ON_SITE" as const },
      { name: "Barba", durationMin: 30, priceCents: 3500, paymentPolicy: "ON_SITE" as const },
      { name: "Corte + barba", durationMin: 60, priceCents: 7000, paymentPolicy: "DEPOSIT" as const, depositPercent: 30 },
      { name: "Pigmentação", durationMin: 45, priceCents: 6000, paymentPolicy: "ONLINE_REQUIRED" as const },
    ].map((s) => db.service.create({ data: { ...s, businessId: business.id } })),
  );

  for (const name of ["Carlos", "Rafael"]) {
    await db.professional.create({
      data: {
        businessId: business.id,
        name,
        services: { create: services.map((s) => ({ serviceId: s.id })) },
        workingHours: {
          create: [1, 2, 3, 4, 5, 6].flatMap((weekday) =>
            weekday === 6
              ? [{ weekday, startMin: 9 * 60, endMin: 14 * 60 }] // sábado só de manhã
              : [
                  { weekday, startMin: 9 * 60, endMin: 12 * 60 },
                  { weekday, startMin: 13 * 60, endMin: 19 * 60 },
                ],
          ),
        },
      },
    });
  }

  console.log("✅ Demo criada: http://localhost:3000/barbearia-demo");
  console.log("   Login do painel: demo@agendai.com / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
