import { NextResponse } from "next/server";
import { extractResumeData } from "@/lib/extract-resume";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume file provided." },
        { status: 400 },
      );
    }

    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and Word documents are supported." },
        { status: 400 },
      );
    }

    const data = await extractResumeData(file);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[extract-resume]", error);
    return NextResponse.json(
      { error: "Failed to extract resume data." },
      { status: 500 },
    );
  }
}