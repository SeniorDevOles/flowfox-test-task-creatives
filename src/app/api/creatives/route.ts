import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreativeData {
  id: string;
  headlineId: string;
  imageId: string;
  campaignId: string;
}

interface CreativeResponse {
  creative: CreativeData;
}

const CreateSchema = z.object({
  campaignId: z.string().min(1),
  headlineId: z.string().min(1),
  imageId: z.string().min(1),
});

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { campaignId, headlineId, imageId } = CreateSchema.parse(body);

    // Ensure all entities exist and belong to the campaign
    const [headline, image, campaign] = await Promise.all([
      prisma.headline.findUnique({ where: { id: headlineId } }),
      prisma.image.findUnique({ where: { id: imageId } }),
      prisma.campaign.findUnique({ where: { id: campaignId } }),
    ]);

    if (!campaign) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }
    if (!headline || headline.campaignId !== campaignId) {
      const response: ApiResponse<never> = { success: false, error: "Headline not found for campaign" };
      return Response.json(response, { status: 404 });
    }
    if (!image || image.campaignId !== campaignId) {
      const response: ApiResponse<never> = { success: false, error: "Image not found for campaign" };
      return Response.json(response, { status: 404 });
    }

    const creative = await prisma.creative.upsert({
      where: {
        // prevent duplicates within the campaign
        campaignId_headlineId_imageId: { campaignId, headlineId, imageId },
      },
      update: { status: "ACTIVE" },
      create: { campaignId, headlineId, imageId, status: "ACTIVE" },
      select: { id: true, headlineId: true, imageId: true, campaignId: true },
    });

    const response: ApiResponse<CreativeResponse> = {
      success: true,
      data: { creative },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to create creative";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
