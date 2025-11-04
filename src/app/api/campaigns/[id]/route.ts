import { supabase } from "@/lib/supabase";

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
  created_at: string;
  headlines: Array<{ id: string; text: string; status: string; created_at: string }>;
  images: Array<{ id: string; image_url: string; prompt: string; status: string; created_at: string }>;
  creatives: Array<{
    id: string;
    headline_id: string;
    image_id: string;
    status: string;
    created_at: string;
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

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("Campaign")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }

    // Fetch related data
    const [headlinesRes, imagesRes, creativesRes] = await Promise.all([
      supabase.from("Headline").select("id, text, status, created_at").eq("campaign_id", id),
      supabase.from("Image").select("id, image_url, prompt, status, created_at").eq("campaign_id", id),
      supabase.from("Creative").select("id, headline_id, image_id, status, created_at").eq("campaign_id", id),
    ]);

    const campaignData: CampaignData = {
      ...campaign,
      headlines: headlinesRes.data || [],
      images: imagesRes.data || [],
      creatives: creativesRes.data || [],
    };

    const response: ApiResponse<CampaignResponse> = {
      success: true,
      data: { campaign: campaignData },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to load campaign";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
