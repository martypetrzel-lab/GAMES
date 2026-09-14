import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Pro seed je nutná proměnná DATABASE_URL.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await db.store.upsert({
    where: { provider_externalId: { provider: "cheapshark", externalId: "1" } },
    create: {
      provider: "cheapshark",
      externalId: "1",
      name: "Steam",
      isActive: true,
      imageUrl: "https://www.cheapshark.com/img/stores/logos/0.png",
    },
    update: { name: "Steam", isActive: true },
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exitCode = 1;
  });
