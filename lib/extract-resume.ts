import Groq from "groq-sdk";
import mammoth from "mammoth";
import AdmZip from "adm-zip";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Lazily-constructed Groq client.
 *
 * IMPORTANT: We do NOT validate/throw on a missing GROQ_API_KEY at module
 * load time. Next.js can import route modules (and everything they import)
 * during `next build` for static analysis, not just at request time.
 * Throwing at import time would crash the *build* on Vercel even when the
 * variable is correctly configured for the Runtime environment, or in
 * preview builds where secrets are intentionally withheld.
 *
 * Validating lazily — the first time a request actually needs the client —
 * keeps this a pure runtime-only code path, which is required for Vercel's
 * serverless functions.
 */
let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (_groq) return _groq;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment variables (Vercel Project Settings → Environment Variables) before calling the resume extraction API.",
    );
  }

  _groq = new Groq({ apiKey });
  return _groq;
}

export type ExtractedResume = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  primaryRole?: string;
  totalTrainingExperience?: number;
  industryExperience?: number;
  expectedChargesPerDay?: string;
  languages?: string;
  detailedExpertise?: string;
  areasOfExpertise?: string[];
  trainingTypesDelivered?: string[];
  availability?: string[];
};

const PROMPT = `
You are a resume parser. Extract the following fields from this resume text and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Rules:
- If only one name is present, put it in firstName and set lastName to ""
- For numeric fields (totalTrainingExperience, industryExperience), if not found set to 0
- For string fields, if not found set to ""
- For array fields, if not found set to []
- Never omit any field from the JSON
- Never leave a numeric field empty — always use 0 if unknown
- For primaryRole, pick the closest match even if not explicitly stated
- For areasOfExpertise, pick from the allowed values based on their skills
- For trainingTypesDelivered, if unclear set to ["Corporate"]
- For availability, if unclear set to ["Weekdays"]
- If any URL contains "linkedin.com" put it in the linkedin field
- If any text contains "@" it is an email — put it in email field
- Any 10-digit number or number starting with +91 is a phone number — put it in phone field
- If multiple emails found, use the most professional one
- If multiple phone numbers found, use the first one

Fields to extract:
- firstName (string)
- lastName (string)
- email (string)
- phone (string)
- location (city and state, e.g. "Mumbai, Maharashtra")
- linkedin (full URL if present, else "")
- primaryRole (one of: "Freelance Trainer", "Corporate Trainer", "Academic Faculty", "Industry Practitioner", "Consultant")
- totalTrainingExperience (number in years, 0 if not found)
- industryExperience (number in years, 0 if not found)
- expectedChargesPerDay (string, e.g. "5000" or "5000-8000", "" if not found)
- languages (comma-separated string, e.g. "English, Hindi")
- detailedExpertise (summary of skills and modules they can deliver)
- areasOfExpertise (array, only use values from: "Technical Trainer", "Soft Skill Trainer", "Mechanical Trainer", "Others")
- trainingTypesDelivered (array, only use values from: "Corporate", "Institute", "Both")
- availability (array, only use values from: "Weekdays", "Weekends", "Part-Time", "Full-Time (Project-Based)")

Return only the JSON object, no explanation, no markdown.
`;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";
const PDF_MIME = "application/pdf";

const MIN_PDF_TEXT_LENGTH = 50;

/**
 * Extracts ALL text from a DOCX including text boxes, headers, footers,
 * and hyperlink URLs — by reading the raw XML inside the DOCX zip.
 *
 * Pure JS (mammoth + adm-zip), no native dependencies — safe on Vercel.
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value: bodyText } = await mammoth.extractRawText({ buffer });

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const allText: string[] = [bodyText];
  const allUrls: string[] = [];

  for (const entry of entries) {
    const name = entry.entryName;

    if (name.startsWith("word/") && name.endsWith(".xml")) {
      const xml = entry.getData().toString("utf8");
      const textMatches = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const texts = textMatches
        .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "").trim())
        .filter(Boolean);
      if (texts.length) allText.push(texts.join(" "));
    }

    if (name.endsWith(".rels")) {
      const xml = entry.getData().toString("utf8");
      const relMatches = xml.match(/Target="([^"]+)"/g) || [];
      for (const rel of relMatches) {
        const url = rel.replace('Target="', "").replace('"', "");
        if (url.startsWith("http")) allUrls.push(url);
      }
    }
  }

  const urlSection = allUrls.length
    ? `\n\nAll hyperlinks found in document:\n${[...new Set(allUrls)].join("\n")}`
    : "";

  return allText.join("\n") + urlSection;
}

/**
 * Extracts text from a PDF using `unpdf`.
 *
 * Why unpdf instead of pdf-parse v2:
 * -----------------------------------------------------------------------
 * `pdf-parse` v2 wraps `pdfjs-dist`, which assumes a browser-like
 * environment with `DOMMatrix`, `ImageData`, and `Path2D` available
 * globally, plus an optional native `canvas` binding (`@napi-rs/canvas`)
 * for rendering. On Vercel's serverless (Node.js Lambda) runtime:
 *   - These browser globals do not exist.
 *   - `@napi-rs/canvas` ships prebuilt native binaries per OS/CPU, and
 *     Next.js's serverless file tracing does not reliably include them
 *     unless every transitive package is explicitly externalized — and
 *     even then, native addons are a common source of "works on my
 *     machine" failures across Lambda's read-only, ephemeral filesystem.
 *   - The result is exactly the error seen here: pdf-parse->pdfjs-dist
 *     tries to polyfill DOMMatrix/ImageData/Path2D via the native canvas
 *     module, that module fails to load, and the polyfill itself throws
 *     `DOMMatrix is not defined` deep inside PDF.js's module-evaluation
 *     code (i.e. before your function body even runs).
 *
 * `unpdf` ships its own pre-bundled, canvas-free build of PDF.js
 * (Rollup-bundled, with browser-only code stripped and the worker
 * inlined) specifically for serverless/edge runtimes. It has zero native
 * dependencies, needs no DOMMatrix/ImageData/Path2D polyfills, and is
 * verified to run on Vercel serverless functions, Vercel Edge, AWS
 * Lambda, and Cloudflare Workers.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  try {
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } finally {
    // Release the document's memory. Vercel functions have a 1GB memory
    // ceiling — always clean up after processing, especially for
    // multi-page PDFs.
    await pdf.destroy();
  }
}

type SupportedFileKind = "pdf" | "doc";

function detectFileKind(file: File): SupportedFileKind | null {
  const isDocx =
    file.type === DOCX_MIME ||
    file.type === DOC_MIME ||
    file.name.toLowerCase().endsWith(".docx") ||
    file.name.toLowerCase().endsWith(".doc");

  if (isDocx) return "doc";

  const isPdf = file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) return "pdf";

  return null;
}

async function extractRawResumeText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const kind = detectFileKind(file);

  if (kind === "doc") {
    return extractTextFromDocx(buffer);
  }

  if (kind === "pdf") {
    const text = await extractTextFromPdf(buffer);
    if (!text || text.trim().length < MIN_PDF_TEXT_LENGTH) {
      throw new Error(
        "Could not extract text from this PDF. It may be scanned or image-based. Please upload a text-based PDF or a Word document.",
      );
    }
    return text;
  }

  throw new Error("Only PDF and Word documents are supported.");
}

function parseGroqJsonResponse(raw: string): ExtractedResume {
  const clean = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

  // The model occasionally emits a dangling/empty value (`"field": ,` or
  // `"field": }`) — normalize those to `null` so JSON.parse doesn't choke,
  // then strip the now-null numeric fields the original API contract
  // expects to be entirely absent rather than null.
  const repaired = clean
    .replace(/":\s*,/g, '": null,')
    .replace(/":\s*}/g, '": null}');

  let parsed: ExtractedResume;
  try {
    parsed = JSON.parse(repaired) as ExtractedResume;
  } catch {
    throw new Error(`Groq returned invalid JSON. Raw response: ${raw}`);
  }

  if (parsed.totalTrainingExperience === null) {
    delete parsed.totalTrainingExperience;
  }
  if (parsed.industryExperience === null) {
    delete parsed.industryExperience;
  }

  return parsed;
}

export async function extractResumeData(file: File): Promise<ExtractedResume> {
  const resumeText = await extractRawResumeText(file);

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: `Resume text:\n\n${resumeText}` },
    ],
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  return parseGroqJsonResponse(text);
}
