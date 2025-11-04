import { supabase } from "@/lib/supabase";

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
  created_at: string;
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
    const { data: campaigns, error } = await supabase
      .from("Campaign")
      .select("id, name, industry, audience, tone, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Get counts for each campaign
    const campaignsWithCounts = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        const [headlinesRes, imagesRes, creativesRes] = await Promise.all([
          supabase.from("Headline").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
          supabase.from("Image").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
          supabase.from("Creative").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
        ]);

        return {
          ...campaign,
          headlineCount: headlinesRes.count || 0,
          imageCount: imagesRes.count || 0,
          creativeCount: creativesRes.count || 0,
        };
      })
    );

    const formattedCampaigns: CampaignListItem[] = campaignsWithCounts.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      industry: campaign.industry,
      audience: campaign.audience,
      tone: campaign.tone,
      created_at: campaign.created_at,
      headlineCount: campaign.headlineCount,
      imageCount: campaign.imageCount,
      creativeCount: campaign.creativeCount,
    }));

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
