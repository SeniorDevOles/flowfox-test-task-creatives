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
  headlines: Array<{ id: string; text: string; status: string; createdAt: Date }>;
  images: Array<{ id: string; imageUrl: string; prompt: string; status: string; createdAt: Date }>;
  creatives: Array<{
    id: string;
    headlineId: string;
    imageId: string;
    status: string;
    createdAt: Date;
  }>;
}

interface CampaignResponse {
  campaign: CampaignData;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        headlines: { select: { id: true, text: true, status: true, createdAt: true } },
        images: { select: { id: true, imageUrl: true, prompt: true, status: true, createdAt: true } },
        creatives: {
          select: {
            id: true,
            headlineId: true,
            imageId: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!campaign) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }
    const response: ApiResponse<CampaignResponse> = {
      success: true,
      data: { campaign },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to load campaign";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
