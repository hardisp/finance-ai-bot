import { prisma } from "../prisma/client.js";

async function main() {
  try {
    const count = await prisma.user.count();
    console.log("Total users in DB:", count);
  } catch (err) {
    console.error("DB test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();