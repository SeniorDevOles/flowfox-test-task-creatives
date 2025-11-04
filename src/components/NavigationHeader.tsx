"use client";
import { useRouter, usePathname } from "next/navigation";

export function NavigationHeader(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              FlowFox Creatives
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {pathname !== "/campaigns" && (
              <button
                onClick={() => router.push("/campaigns")}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                All Campaigns
              </button>
            )}
            
            {pathname !== "/" && (
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                + New Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

