"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { showToast } from "@/components/Toast";
import { ImageWithLoader } from "@/components/ImageWithLoader";

type Headline = { id: string; text: string };
type Img = { id: string; imageUrl: string; prompt: string };
type Creative = { id: string; headlineId: string; imageId: string };

async function fetchCampaign(id: string) {
  const res = await fetch(`/api/campaigns/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to load campaign");
  return json.data.campaign as {
    id: string;
    name: string;
    industry: string;
    audience: string;
    tone: string;
    description?: string;
    headlines: Array<{ id: string; text: string }>;
    images: Array<{ id: string; imageUrl: string; prompt: string }>;
    creatives: Array<{ id: string; headlineId: string; imageId: string }>;
  };
}

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [images, setImages] = useState<Img[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [countH, setCountH] = useState(5);
  const [countI, setCountI] = useState(3);
  const [genLoading, setGenLoading] = useState<"headlines" | "images" | null>(null);
  const [pairing, setPairing] = useState<{ headlineId?: string; imageId?: string }>({});
  const [genError, setGenError] = useState<{ type: "headlines" | "images"; message: string } | null>(null);
  const [deletingCreative, setDeletingCreative] = useState<string | null>(null);

  const pairedHeadlineIds = useMemo(() => new Set(creatives.map((c) => c.headlineId)), [creatives]);
  const pairedImageIds = useMemo(() => new Set(creatives.map((c) => c.imageId)), [creatives]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaign(campaignId);
      setHeadlines(data.headlines);
      setImages(data.images);
      setCreatives(data.creatives);
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      showToast(`Failed to load campaign: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const generateHeadlines = async () => {
    if (genLoading !== null) return; // Prevent multiple simultaneous requests
    
    setGenLoading("headlines");
    setGenError(null);
    try {
      const ctxRes = await fetch(`/api/campaigns/${campaignId}`);
      if (!ctxRes.ok) throw new Error("Failed to load campaign context");
      const ctxJson = await ctxRes.json();
      if (!ctxJson.success) throw new Error(ctxJson.error || "Failed to load campaign");
      const c = ctxJson.data.campaign;

      const res = await fetch(`/api/ai/headlines/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          count: countH,
          context: {
            name: c.name,
            industry: c.industry,
            audience: c.audience,
            tone: c.tone.toLowerCase(),
            description: c.description ?? undefined,
          },
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to generate headlines");
      
      const generatedCount = json.data?.headlines?.length ?? 0;
      showToast(`Successfully generated ${generatedCount} headline${generatedCount !== 1 ? "s" : ""}`, "success");
      await refresh();
    } catch (e) {
      const errorMessage = (e as Error).message;
      setGenError({ type: "headlines", message: errorMessage });
      showToast(`Failed to generate headlines: ${errorMessage}`, "error");
    } finally {
      setGenLoading(null);
    }
  };

  const generateImages = async () => {
    if (genLoading !== null) return; // Prevent multiple simultaneous requests
    
    setGenLoading("images");
    setGenError(null);
    try {
      const ctxRes = await fetch(`/api/campaigns/${campaignId}`);
      if (!ctxRes.ok) throw new Error("Failed to load campaign context");
      const ctxJson = await ctxRes.json();
      if (!ctxJson.success) throw new Error(ctxJson.error || "Failed to load campaign");
      const c = ctxJson.data.campaign;

      const res = await fetch(`/api/ai/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          count: countI,
          context: {
            name: c.name,
            industry: c.industry,
            audience: c.audience,
            tone: c.tone.toLowerCase(),
            description: c.description ?? undefined,
          },
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to generate images");
      
      const generatedCount = json.data?.images?.length ?? 0;
      showToast(`Successfully generated ${generatedCount} image${generatedCount !== 1 ? "s" : ""}`, "success");
      await refresh();
    } catch (e) {
      const errorMessage = (e as Error).message;
      setGenError({ type: "images", message: errorMessage });
      showToast(`Failed to generate images: ${errorMessage}`, "error");
    } finally {
      setGenLoading(null);
    }
  };

  const createPair = async () => {
    if (!pairing.headlineId || !pairing.imageId) return;
    
    try {
      const res = await fetch(`/api/creatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          headlineId: pairing.headlineId,
          imageId: pairing.imageId,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create creative pair");
      
      showToast("Creative pair created successfully", "success");
      setPairing({});
      await refresh();
    } catch (e) {
      const errorMessage = (e as Error).message;
      showToast(`Failed to create pair: ${errorMessage}`, "error");
    }
  };

  const deleteCreative = async (id: string) => {
    if (!confirm("Are you sure you want to delete this creative?")) return;
    
    setDeletingCreative(id);
    try {
      const res = await fetch(`/api/creatives/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete creative");
      
      showToast("Creative deleted successfully", "success");
      await refresh();
    } catch (e) {
      const errorMessage = (e as Error).message;
      showToast(`Failed to delete creative: ${errorMessage}`, "error");
    } finally {
      setDeletingCreative(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Campaign</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => void refresh()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedHeadline = pairing.headlineId ? headlines.find((h) => h.id === pairing.headlineId) : null;
  const selectedImage = pairing.imageId ? images.find((img) => img.id === pairing.imageId) : null;

  return (
    <div className="min-h-screen p-6">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Campaign: {headlines.length} headlines, {images.length} images
        </h1>
        <p className="text-sm text-gray-600">
          Generate headlines and images, then pair them to create marketing creatives.
        </p>
      </div>

      {/* Generation Controls */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Headlines Generation */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Headlines (3-5):
              </label>
              <input
                type="number"
                min={3}
                max={5}
                value={countH}
                onChange={(e) => setCountH(Number(e.target.value))}
                className="w-20 border rounded px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={genLoading !== null}
              />
              <button
                disabled={genLoading !== null}
                onClick={generateHeadlines}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {genLoading === "headlines" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  "Generate Headlines"
                )}
              </button>
            </div>
            {genError?.type === "headlines" && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                <p className="font-medium mb-1">Generation failed:</p>
                <p>{genError.message}</p>
                <button
                  onClick={generateHeadlines}
                  className="mt-2 text-red-600 underline hover:text-red-800"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Images Generation */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Images (1-5):
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={countI}
                onChange={(e) => setCountI(Number(e.target.value))}
                className="w-20 border rounded px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={genLoading !== null}
              />
              <button
                disabled={genLoading !== null}
                onClick={generateImages}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {genLoading === "images" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  "Generate Images"
                )}
              </button>
            </div>
            {genError?.type === "images" && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                <p className="font-medium mb-1">Generation failed:</p>
                <p>{genError.message}</p>
                <button
                  onClick={generateImages}
                  className="mt-2 text-red-600 underline hover:text-red-800"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pairing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Headlines */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-gray-900 flex items-center justify-between">
            <span>Headlines ({headlines.length})</span>
            {selectedHeadline && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Selected</span>
            )}
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {headlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No headlines yet.</p>
                <p className="text-sm mt-1">Generate headlines to get started.</p>
              </div>
            ) : (
              headlines.map((h) => (
                <div
                  key={h.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    pairing.headlineId === h.id
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                      : pairedHeadlineIds.has(h.id)
                      ? "bg-gray-50 border-gray-300"
                      : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                  onClick={() => setPairing((p) => ({ ...p, headlineId: h.id }))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-gray-900 flex-1">{h.text}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {pairedHeadlineIds.has(h.id) && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          Paired
                        </span>
                      )}
                      {pairing.headlineId === h.id && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-gray-900 flex items-center justify-between">
            <span>Images ({images.length})</span>
            {selectedImage && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Selected</span>
            )}
          </h2>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {images.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <p>No images yet.</p>
                <p className="text-sm mt-1">Generate images to get started.</p>
              </div>
            ) : (
              images.map((img) => (
                <div
                  key={img.id}
                  className={`relative group cursor-pointer transition-all ${
                    pairing.imageId === img.id
                      ? "ring-4 ring-blue-500 ring-offset-2"
                      : pairedImageIds.has(img.id)
                      ? "opacity-75"
                      : ""
                  }`}
                  onClick={() => setPairing((p) => ({ ...p, imageId: img.id }))}
                >
                  <ImageWithLoader
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full aspect-[16/9] object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    {pairedImageIds.has(img.id) && (
                      <span className="text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                        Paired
                      </span>
                    )}
                    {pairing.imageId === img.id && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                    {pairing.imageId === img.id && (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-medium">
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pair Action */}
      {selectedHeadline && selectedImage && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Ready to Pair</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Headline:</span> {selectedHeadline.text}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Image:</span> Selected
                </p>
              </div>
            </div>
            <button
              onClick={createPair}
              className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Create Creative Pair
            </button>
          </div>
        </div>
      )}

      {/* Creatives Gallery */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="font-semibold mb-4 text-gray-900">Creatives Gallery ({creatives.length})</h2>
        {creatives.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-4">🎨</div>
            <p className="text-gray-600 font-medium mb-2">No creatives yet</p>
            <p className="text-sm text-gray-500">
              Generate headlines and images, then select and pair them to create your first creative.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatives.map((c) => {
              const h = headlines.find((x) => x.id === c.headlineId);
              const img = images.find((x) => x.id === c.imageId);
              if (!h || !img) return null;
              return (
                <div
                  key={c.id}
                  className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group"
                >
                  <ImageWithLoader
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full aspect-[16/9] object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-900 mb-3 line-clamp-2">{h.text}</p>
                    <button
                      onClick={() => deleteCreative(c.id)}
                      disabled={deletingCreative === c.id}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deletingCreative === c.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
