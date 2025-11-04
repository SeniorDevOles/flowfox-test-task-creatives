import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreativeData {
  id: string;
}

interface CreativeResponse {
  creative: CreativeData;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    
    const { data: deleted, error } = await supabase
      .from("Creative")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error || !deleted) {
      throw new Error(error?.message || "Failed to delete creative");
    }

    const response: ApiResponse<CreativeResponse> = {
      success: true,
      data: { creative: deleted },
    };
    return Response.json(response);
  } catch (err: unknown) {
    const errorMessage = isError(err) ? err.message : "Failed to delete creative";
    const response: ApiResponse<never> = { success: false, error: errorMessage };
    return Response.json(response, { status: 400 });
  }
}
