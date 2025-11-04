import { prisma } from "@/lib/prisma";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CampaignListItem {
  id: string;
  name: string;
  industry: string;
  audience: string;
  tone: string;
  createdAt: Date;
  headlineCount: number;
  imageCount: number;
  creativeCount: number;
}

interface CampaignsListResponse {
  campaigns: CampaignListItem[];
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function GET(): Promise<Response> {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        industry: true,
        audience: true,
        tone: true,
        createdAt: true,
        _count: {
          select: {
            headlines: true,
            images: true,
            creatives: true,
          },
        },
      },
    });

    type CampaignWithCount = {
      id: string;
      name: string;
      industry: string;
      audience: string;
      tone: string;
      createdAt: Date;
      _count: {
        headlines: number;
        images: number;
        creatives: number;
      };
    };

    const formattedCampaigns: CampaignListItem[] = campaigns.map(
      (campaign: CampaignWithCount): CampaignListItem => ({
        id: campaign.id,
        name: campaign.name,
        industry: campaign.industry,
        audience: campaign.audience,
        tone: campaign.tone,
        createdAt: campaign.createdAt,
        headlineCount: campaign._count.headlines,
        imageCount: campaign._count.images,
        creativeCount: campaign._count.creatives,
      })
    );

    const response: ApiResponse<CampaignsListResponse> = {
      success: true,
      data: { campaigns: formattedCampaigns },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to load campaigns";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 500 });
  }
}

