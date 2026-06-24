/**
 * Seed script: imports IYD'26 companies into the Organization table.
 * Run with: npx ts-node --skip-project scripts/seed-iyd-orgs.ts
 * Or:       npx tsx scripts/seed-iyd-orgs.ts
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

pg.defaults.ssl = { rejectUnauthorized: false } as any;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any);

const companies = [
  { name: "Course5i",               city: "Coimbatore" },
  { name: "3S",                     city: null },
  { name: "Antino",                 city: "Gurgaon" },
  { name: "Egis",                   city: "Gurgaon" },
  { name: "Patra",                  city: null },
  { name: "Mindlance",              city: null },
  { name: "Globus",                 city: "Noida" },
  { name: "Kinara",                 city: "Bangalore" },
  { name: "Fifty Five Technologies",city: "Gurgaon" },
  { name: "Brinks",                 city: "Mumbai" },
  { name: "Oil Company",            city: "Nellore" },
  { name: "Thoughtsol",             city: "Noida" },
  { name: "Indusnet Technology",    city: "Kolkata" },
  { name: "Flipkart",               city: "Kalyani" },
  { name: "Vinati Organics",        city: "Mumbai" },
  { name: "Prakash Software",       city: "Indore" },
  { name: "Infobeans",              city: "Pune" },
  { name: "Fitsols",                city: "Gurgaon" },
  { name: "RNF",                    city: "Noida" },
  { name: "Hellman",                city: "Gurgaon" },
];

async function main() {
  console.log(`Seeding ${companies.length} organizations...`);

  for (const company of companies) {
    const existing = await prisma.organization.findFirst({
      where: { name: { equals: company.name, mode: "insensitive" } },
    });

    if (existing) {
      console.log(`  SKIP  ${company.name} (already exists)`);
      continue;
    }

    await prisma.organization.create({
      data: {
        name: company.name,
        city: company.city,
        type: "CORPORATE",
      },
    });
    console.log(`  ADDED ${company.name} — ${company.city ?? "no city"}`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
