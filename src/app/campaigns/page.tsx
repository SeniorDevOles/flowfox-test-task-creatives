"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

interface CampaignListItem {
  id: string;
  name: string;
  industry: string;
  audience: string;
  tone: string;
  createdAt: string;
  headlineCount: number;
  imageCount: number;
  creativeCount: number;
}

interface CampaignsResponse {
  campaigns: CampaignListItem[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getToneColor(tone: string): string {
  const toneMap: Record<string, string> = {
    PROFESSIONAL: "bg-blue-100 text-blue-800",
    CASUAL: "bg-green-100 text-green-800",
    EXCITING: "bg-orange-100 text-orange-800",
    TRUSTWORTHY: "bg-purple-100 text-purple-800",
  };
  return toneMap[tone] || "bg-gray-100 text-gray-800";
}

function getToneLabel(tone: string): string {
  return tone.charAt(0) + tone.slice(1).toLowerCase();
}

export default function CampaignsListPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns/list");
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to load campaigns");
      }
      const data = json.data as CampaignsResponse;
      setCampaigns(data.campaigns);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load campaigns";
      setError(errorMessage);
      showToast(`Failed to load campaigns: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Campaigns</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => void fetchCampaigns()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns History</h1>
          <p className="text-gray-600">
            View and manage all your marketing campaigns. Click on a campaign to edit or create creatives.
          </p>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first campaign to start generating headlines and images for your marketing creatives.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => router.push(`/campaign/${campaign.id}`)}
                className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {campaign.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded ${getToneColor(campaign.tone)}`}>
                    {getToneLabel(campaign.tone)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Industry:</span>
                    <span>{campaign.industry}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Audience:</span>
                    <span>{campaign.audience}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    Created {formatDate(campaign.createdAt)}
                  </div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">📝</span>
                      <span className="font-medium text-gray-900">{campaign.headlineCount}</span>
                      <span className="text-gray-500">headlines</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">🖼️</span>
                      <span className="font-medium text-gray-900">{campaign.imageCount}</span>
                      <span className="text-gray-500">images</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-500">✨</span>
                    <span className="font-semibold text-blue-600">{campaign.creativeCount}</span>
                    <span className="text-gray-500">creatives</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
                    Open Campaign →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

