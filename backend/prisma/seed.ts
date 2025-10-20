import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@financeai.local" },
    update: {},
    create: {
      email: "demo@financeai.local",
      name: "Demo Advisor",
      tokens: {
        create: [
          {
            provider: "google",
            accessToken: "fake-access-token",
            refreshToken: "fake-refresh-token",
          },
          {
            provider: "hubspot",
            accessToken: "fake-hubspot-access-token",
          },
        ],
      },
      Task: {
        create: [
          {
            description: "Schedule appointment with Sara Smith",
            status: "pending",
          },
          {
            description: "Reply to Greg about AAPL stock",
            status: "completed",
          },
        ],
      },
      OngoingInstruction: {
        create: [
          {
            rule: "When new email sender is not in HubSpot, create a contact.",
          },
          { rule: "When I add an event in calendar, notify attendees." },
        ],
      },
    },
  });

  console.log("Seeded user:", demoUser.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
