/**
 * scripts/import-yoga-trainers.ts
 *
 * Imports yoga trainers from 3 source files:
 *
 * 1. Yoga_Trainers.xlsx          — simple list (Name, Location, Phone)
 * 2. Yoga Trainer Information Intake Form (Responses).xlsx
 *                                — Google Form responses with full details
 * 3. IYD'26.xlsx                 — event data; extracts instructor names/phones
 *
 * Run with: npx tsx scripts/import-yoga-trainers.ts
 */

import * as XLSX from "xlsx";
import * as path from "path";
import pg from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCRIPTS_DIR = path.join(process.cwd(), "scripts");
const ONBOARDED_YEAR = 2026;
const CONNECTION_STRING =
  "postgresql://postgres:Trainermanagement%40mindery@db.gdfctrxpqcfkeozjsatv.supabase.co:5432/postgres";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseExperience(raw: string | undefined): number {
  if (!raw) return 0;
  const s = raw.toString().trim().toLowerCase();
  if (["fresher", "less than a year", "6 months", "<1"].some((x) => s.includes(x))) return 0;
  const sinceMatch = s.match(/since\s+\d+\s*[-–]\s*(\d+)/);
  if (sinceMatch) return parseInt(sinceMatch[1], 10);
  const rangeMatch = s.match(/(\d+)\s*[-–]\s*\d+/);
  if (rangeMatch) return parseInt(rangeMatch[1], 10);
  const numMatch = s.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 0;
}

function parseYogaStyles(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.toLowerCase().includes("please specify"));
}

function parseCertification(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.includes("E-RYT 500")) return "E-RYT 500";
  if (s.includes("E-RYT 200")) return "E-RYT 200";
  if (s.includes("RYT 300/500") || s.includes("RYT300/500")) return "RYT 300/500";
  if (s.includes("RYT 300") || s.includes("RYT 500")) return "RYT 300/500";
  if (s.includes("RYT 200")) return "RYT 200";
  if (s.includes("Certified Yoga Therapist")) return "Certified Yoga Therapist";
  if (s.includes("Other recognized")) return "Other";
  return s.substring(0, 100);
}

function parsePhone(raw: string | number | undefined): string | null {
  if (!raw) return null;
  return raw.toString().trim().replace(/\s+/g, "").replace(/[^\d+]/g, "") || null;
}

function parseEmail(raw: string | undefined): string | null {
  if (!raw) return null;
  const email = raw.toString().trim().toLowerCase();
  if (!email.includes("@") || !email.includes(".")) return null;
  return email;
}

function stableKey(name: string, phone?: string | null): string {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const phoneSuffix = phone ? `_${phone.replace(/\D/g, "").slice(-4)}` : "";
  return `noemail_${slug}${phoneSuffix}`;
}

interface TrainerRecord {
  name: string;
  email: string;
  realEmail: boolean;
  phone: string | null;
  city: string | null;
  experience: number;
  yogaStyles: string[];
  certification: string | null;
  source: string;
}

// ---------------------------------------------------------------------------
// File readers
// ---------------------------------------------------------------------------

function readSimpleList(filePath: string): TrainerRecord[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return rows
    .filter((r) => r["Name"]?.toString().trim())
    .map((r) => {
      const name = r["Name"].toString().trim();
      const phone = parsePhone(r["Phone number"]);
      return {
        name,
        email: stableKey(name, phone),
        realEmail: false,
        phone,
        city: r["Location"]?.toString().trim() || null,
        experience: 0,
        yogaStyles: [],
        certification: null,
        source: "Yoga_Trainers.xlsx",
      };
    });
}

function readIntakeForm(filePath: string): TrainerRecord[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return rows
    .filter((r) => r["Full Name"]?.toString().trim())
    .map((r) => {
      const name = r["Full Name"].toString().trim();
      const email = parseEmail(r["Primary Contact Email Address"]);
      const phone = parsePhone(r["Mobile Number"]);
      return {
        name,
        email: email ?? stableKey(name, phone),
        realEmail: !!email,
        phone,
        city: r["City"]?.toString().trim() || null,
        experience: parseExperience(r["Years of Professional Yoga Teaching Experience"]),
        yogaStyles: parseYogaStyles(r["Primary Yoga Style(s) Taught (Select all that apply)"]),
        certification: parseCertification(r["Highest Level of Yoga Certification Obtained (e.g., RYT 200, RYT 500)"]),
        source: "Intake Form",
      };
    });
}

function readIYDInstructors(filePath: string): TrainerRecord[] {
  const wb = XLSX.readFile(filePath);
  const records: TrainerRecord[] = [];
  for (const sheetName of ["Confirmed", "Inloop"]) {
    if (!wb.SheetNames.includes(sheetName)) continue;
    const ws = wb.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    for (const r of rows) {
      const name = (r["Instructor's  Name"] || r["Instructor's Name"] || "").toString().trim();
      if (!name) continue;
      const phone = parsePhone(r["Instructor's  Mobile no."] || r["Instructor's Mobile no."]);
      const email = parseEmail(r["Instructor's Email Address"] || "");
      const city = (r["City"] || "").toString().trim() || null;
      records.push({
        name,
        email: email ?? stableKey(name, phone),
        realEmail: !!email,
        phone,
        city,
        experience: 0,
        yogaStyles: [],
        certification: null,
        source: `IYD'26 - ${sheetName}`,
      });
    }
  }
  return records;
}

function mergeRecords(all: TrainerRecord[]): TrainerRecord[] {
  const map = new Map<string, TrainerRecord>();
  for (const record of all) {
    const key = record.email.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, record);
    } else {
      map.set(key, {
        ...existing,
        experience: record.experience || existing.experience,
        yogaStyles: record.yogaStyles.length ? record.yogaStyles : existing.yogaStyles,
        certification: record.certification || existing.certification,
        city: record.city || existing.city,
        phone: record.phone || existing.phone,
        email: record.realEmail ? record.email : existing.email,
        realEmail: record.realEmail || existing.realEmail,
        source: `${existing.source} + ${record.source}`,
      });
    }
  }
  return [...map.values()];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Use pg.Pool with rejectUnauthorized:false to bypass self-signed cert issue
  const pool = new pg.Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  console.log("Reading source files...\n");

  const simpleList = readSimpleList(path.join(SCRIPTS_DIR, "Yoga_Trainers.xlsx"));
  console.log(`  Yoga_Trainers.xlsx:       ${simpleList.length} rows`);

  const intakeForm = readIntakeForm(
    path.join(SCRIPTS_DIR, "Yoga Trainer Information Intake Form (Responses).xlsx")
  );
  console.log(`  Intake Form (Responses):  ${intakeForm.length} rows`);

  const iydInstructors = readIYDInstructors(path.join(SCRIPTS_DIR, "IYD'26.xlsx"));
  console.log(`  IYD'26 instructors:       ${iydInstructors.length} rows`);

  const merged = mergeRecords([...simpleList, ...intakeForm, ...iydInstructors]);
  console.log(`\nAfter deduplication:      ${merged.length} unique trainers`);
  console.log("\nStarting DB import...\n");

  let created = 0;
  let errors = 0;

  for (const t of merged) {
    try {
      const nameParts = t.name.split(/\s+/);
      const firstName = nameParts[0] || t.name;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      await prisma.trainer.upsert({
        where: { email: t.email },
        update: {
          ...(t.yogaStyles.length ? { yogaStyles: t.yogaStyles } : {}),
          ...(t.certification ? { certification: t.certification } : {}),
          ...(t.experience ? { experience: t.experience } : {}),
          ...(t.city ? { city: t.city } : {}),
          ...(t.phone ? { phone: t.phone } : {}),
          trainerType: "YOGA",
        },
        create: {
          name: t.name,
          firstName,
          lastName,
          email: t.email,
          phone: t.phone ?? undefined,
          city: t.city,
          location: t.city,
          experience: t.experience,
          totalTrainingExperience: t.experience,
          trainerType: "YOGA",
          yogaStyles: t.yogaStyles,
          certification: t.certification ?? undefined,
          onboardedYear: ONBOARDED_YEAR,
          primaryRole: "Yoga Trainer",
          skills: t.yogaStyles.join(", "),
          areasOfExpertise: t.yogaStyles,
        },
      });

      created++;
      console.log(
        `  ✓ ${t.name.padEnd(30)} | ${(t.city ?? "?").padEnd(15)} | ${t.experience}yr | ${t.certification ?? "-"}`
      );
    } catch (err) {
      errors++;
      console.error(`  ✗ ${t.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Imported: ${created} | Errors: ${errors}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
