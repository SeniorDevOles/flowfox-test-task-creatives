import type { NextRequest } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreativeData {
  id: string;
  headline_id: string;
  image_id: string;
  campaign_id: string;
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
    const [headlineRes, imageRes, campaignRes] = await Promise.all([
      supabase.from("Headline").select("id, campaign_id").eq("id", headlineId).single(),
      supabase.from("Image").select("id, campaign_id").eq("id", imageId).single(),
      supabase.from("Campaign").select("id").eq("id", campaignId).single(),
    ]);

    if (campaignRes.error || !campaignRes.data) {
      const response: ApiResponse<never> = { success: false, error: "Campaign not found" };
      return Response.json(response, { status: 404 });
    }
    if (headlineRes.error || !headlineRes.data || headlineRes.data.campaign_id !== campaignId) {
      const response: ApiResponse<never> = { success: false, error: "Headline not found for campaign" };
      return Response.json(response, { status: 404 });
    }
    if (imageRes.error || !imageRes.data || imageRes.data.campaign_id !== campaignId) {
      const response: ApiResponse<never> = { success: false, error: "Image not found for campaign" };
      return Response.json(response, { status: 404 });
    }

    // Check if creative already exists
    const { data: existing } = await supabase
      .from("Creative")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("headline_id", headlineId)
      .eq("image_id", imageId)
      .single();

    let creative;
    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from("Creative")
        .update({ status: "ACTIVE" })
        .eq("id", existing.id)
        .select("id, headline_id, image_id, campaign_id")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message || "Failed to update creative");
      }
      creative = updated;
    } else {
      // Create new
      const { data: created, error: insertError } = await supabase
        .from("Creative")
        .insert({
          campaign_id: campaignId,
          headline_id: headlineId,
          image_id: imageId,
          status: "ACTIVE",
        })
        .select("id, headline_id, image_id, campaign_id")
        .single();

      if (insertError || !created) {
        throw new Error(insertError?.message || "Failed to create creative");
      }
      creative = created;
    }

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
