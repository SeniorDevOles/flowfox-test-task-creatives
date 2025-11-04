import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
    // Remove the creative record (does not delete headline/image)
    const deleted = await prisma.creative.delete({
      where: { id },
      select: { id: true },
    });
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
