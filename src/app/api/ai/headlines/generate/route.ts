import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface HeadlineData {
  id: string;
  text: string;
}

interface HeadlinesResponse {
  headlines: HeadlineData[];
}

const ContextSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  audience: z.string().min(1),
  tone: z.enum(["professional", "casual", "exciting", "trustworthy"]),
  description: z.string().optional(),
});

const RequestSchema = z.object({
  campaignId: z.string().min(1),
  count: z.number().int().min(3).max(5),
  context: ContextSchema,
});

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { campaignId, count, context } = RequestSchema.parse(body);

    // Ensure campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }

    const openai = getOpenAIClient();

    const systemPrompt = `Du bist ein erstklassiger Werbetexter für den deutschen Markt.
Generiere ${count} unterschiedliche, handlungsorientierte und nutzenorientierte Headlines auf Deutsch (8-15 Wörter).
Berücksichtige Branche, Zielgruppe und Tonalität. Antworte ausschließlich im JSON-Format:
{"headlines": [{"text": "..."}, ...]}`;

    const userPrompt = `Kampagne:
Name: ${context.name}
Branche: ${context.industry}
Zielgruppe: ${context.audience}
Ton: ${context.tone}
Beschreibung: ${context.description ?? "-"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { headlines?: Array<{ text: unknown }> };
    
    // Type guard for headline validation
    const items = (parsed.headlines || [])
      .map((h) => {
        if (h && typeof h === "object" && "text" in h && typeof h.text === "string") {
          return h.text.trim();
        }
        return "";
      })
      .filter((t): t is string => t.length > 0)
      .slice(0, count);

    if (items.length === 0) {
      const response: ApiResponse<never> = { success: false, error: "No headlines generated" };
      return Response.json(response, { status: 500 });
    }

    // Ensure we only create exactly the requested count
    const itemsToCreate = items.slice(0, count);

    const created = await prisma.$transaction(
      itemsToCreate.map((text) =>
        prisma.headline.create({
          data: {
            text,
            status: "READY",
            campaignId,
          },
          select: { id: true, text: true },
        })
      )
    );

    const response: ApiResponse<HeadlinesResponse> = {
      success: true,
      data: { headlines: created },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to generate headlines";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
