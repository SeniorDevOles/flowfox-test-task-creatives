"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

const CampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  industry: z.string().min(1, "Industry is required"),
  audience: z.string().min(1, "Target audience is required"),
  tone: z.enum(["professional", "casual", "exciting", "trustworthy"], {
    message: "Please select a tone",
  }),
  description: z.string().optional(),
});

type CampaignForm = z.infer<typeof CampaignSchema>;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignForm>({ resolver: zodResolver(CampaignSchema) });

  const onSubmit = async (data: CampaignForm) => {
    try {
      setLoading(true);
      setSubmitError(null);
      
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create campaign");
      }

      const id: string = json.data.campaign.id;
      showToast("Campaign created successfully", "success");
      router.push(`/campaign/${id}`);
    } catch (e) {
      const errorMessage = (e as Error).message;
      setSubmitError(errorMessage);
      showToast(`Failed to create campaign: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create New Campaign</h1>
          <p className="text-gray-600">
            Fill in the campaign details below. After creating, you&apos;ll be able to generate headlines and images.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white border rounded-lg shadow-sm p-6">
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium">{submitError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`mt-1 w-full border rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
              placeholder="e.g., Summer Sale 2024"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <input
              className={`mt-1 w-full border rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.industry ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
              placeholder="e.g., Insurance, SaaS, Real Estate"
              {...register("industry")}
            />
            {errors.industry && (
              <p className="text-red-600 text-sm mt-1">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <input
              className={`mt-1 w-full border rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.audience ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
              placeholder="e.g., Small business owners, Ages 25-40"
              {...register("audience")}
            />
            {errors.audience && (
              <p className="text-red-600 text-sm mt-1">{errors.audience.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone <span className="text-red-500">*</span>
            </label>
            <select
              className={`mt-1 w-full border rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.tone ? "border-red-300" : "border-gray-300"
              }`}
              disabled={loading}
              {...register("tone")}
            >
              <option value="">Select a tone...</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="exciting">Exciting</option>
              <option value="trustworthy">Trustworthy</option>
            </select>
            {errors.tone && (
              <p className="text-red-600 text-sm mt-1">{errors.tone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              disabled={loading}
              placeholder="Additional campaign details..."
              {...register("description")}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

