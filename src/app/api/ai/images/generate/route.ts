import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/openai";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ImageData {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface ImagesResponse {
  images: ImageData[];
}

const ContextSchema = z
  .object({
    name: z.string().optional(),
    industry: z.string().optional(),
    audience: z.string().optional(),
    tone: z.enum(["professional", "casual", "exciting", "trustworthy"]).optional(),
    description: z.string().optional(),
  })
  .optional();

const RequestSchema = z.object({
  campaignId: z.string().min(1),
  count: z.number().int().min(1).max(5),
  context: ContextSchema,
});

function buildPrompt(context?: z.infer<typeof ContextSchema>): string {
  const base = [
    "Professional, brand-safe campaign imagery, cinematic lighting, photo-realistic, 16:9.",
  ];
  if (context) {
    if (context.industry) base.push(`Industry: ${context.industry}.`);
    if (context.audience) base.push(`Target audience: ${context.audience}.`);
    if (context.tone) base.push(`Tone: ${context.tone}.`);
    if (context.description) base.push(`Details: ${context.description}.`);
  }
  return base.join(" ");
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { campaignId, count, context } = RequestSchema.parse(body);

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }

    const openai = getOpenAIClient();
    const prompt = buildPrompt(context);

    // Generate images sequentially (DALL-E 3 doesn't support parallel generation)
    const results: ImageData[] = [];
    for (let i = 0; i < count; i++) {
      const res = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${prompt} Aspect ratio: 16:9 landscape.`,
        size: "1024x1024",
      });
      const data = res.data?.[0];
      const url = data?.url;
      if (!url) {
        throw new Error("Image generation returned no URL");
      }
      const created = await prisma.image.create({
        data: {
          imageUrl: url,
          prompt,
          status: "READY",
          campaignId,
        },
        select: { id: true, imageUrl: true, prompt: true },
      });
      results.push(created);
    }

    const response: ApiResponse<ImagesResponse> = {
      success: true,
      data: { images: results },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to generate images";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
