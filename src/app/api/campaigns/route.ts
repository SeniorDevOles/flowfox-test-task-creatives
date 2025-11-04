import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CampaignData {
  id: string;
  name: string;
  industry: string;
  audience: string;
  tone: string;
  description?: string | null;
  createdAt: Date;
}

interface CampaignResponse {
  campaign: CampaignData;
}

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  audience: z.string().min(1),
  tone: z.enum(["professional", "casual", "exciting", "trustworthy"]),
  description: z.string().optional(),
});

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const dto = CreateCampaignSchema.parse(body);

    const toneMap = {
      professional: "PROFESSIONAL",
      casual: "CASUAL",
      exciting: "EXCITING",
      trustworthy: "TRUSTWORTHY",
    } as const;

    const created = await prisma.campaign.create({
      data: {
        name: dto.name,
        industry: dto.industry,
        audience: dto.audience,
        tone: toneMap[dto.tone],
        description: dto.description,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        audience: true,
        tone: true,
        description: true,
        createdAt: true,
      },
    });

    const response: ApiResponse<CampaignResponse> = {
      success: true,
      data: { campaign: created },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to create campaign";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
