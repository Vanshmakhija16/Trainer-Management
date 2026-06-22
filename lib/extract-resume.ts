import Groq from "groq-sdk";
import mammoth from "mammoth";
import AdmZip from "adm-zip";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

/**
 * Extracts ALL text from a DOCX including text boxes, headers, footers,
 * and hyperlink URLs — by reading the raw XML inside the DOCX zip.
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
 * Extracts text from PDF using pdf-parse v2's class-based API.
 * PDFParse is instantiated with the buffer, then getText() is called.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text;
}

export async function extractResumeData(file: File): Promise<ExtractedResume> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const isDocx =
    file.type === DOCX_MIME ||
    file.type === DOC_MIME ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".doc");

  const isPdf =
    file.type === "application/pdf" || file.name.endsWith(".pdf");

  let resumeText = "";

  if (isDocx) {
    resumeText = await extractTextFromDocx(buffer);
  } else if (isPdf) {
    resumeText = await extractTextFromPdf(buffer);
    if (!resumeText || resumeText.length < 50) {
      throw new Error(
        "Could not extract text from this PDF. It may be scanned or image-based. Please upload a text-based PDF or a Word document.",
      );
    }
  } else {
    throw new Error("Only PDF and Word documents are supported.");
  }

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: `Resume text:\n\n${resumeText}` },
    ],
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  const clean = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

  try {
    const fixed = clean.replace(/":\s*,/g, '": null,').replace(/":\s*}/g, '": null}');
    const parsed = JSON.parse(fixed) as ExtractedResume;
    if (parsed.totalTrainingExperience === null) delete parsed.totalTrainingExperience;
    if (parsed.industryExperience === null) delete parsed.industryExperience;
    return parsed;
  } catch {
    throw new Error("Groq returned invalid JSON. Raw response: " + text);
  }
}
