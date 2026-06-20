import { NextResponse } from "next/server";
import type { DocumentType } from "@/app/generated/prisma/enums";
import { ActivityType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { eventDocumentSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const [doc] = await prisma.$transaction([
    prisma.eventDocument.create({
      data: {
        eventId: parsed.data.eventId,
        fileName: parsed.data.fileName,
        fileUrl: parsed.data.fileUrl,
        documentType: parsed.data.documentType as DocumentType,
      },
    }),
    prisma.eventActivity.create({
      data: {
        eventId: parsed.data.eventId,
        activityType: ActivityType.DOCUMENT_ADDED,
        description: `Document added: ${parsed.data.fileName}`,
      },
    }),
  ]);
  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  try {
    await prisma.eventDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete document." }, { status: 500 });
  }
}
