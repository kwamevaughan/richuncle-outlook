import { Icon } from "@iconify/react";

export default function StoreAssignmentSection({
  user,
  storeData,
  mode = "light",
}) {
  if (!user.store_id) return null;

  return (
    <div
      className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm ${
        mode === "dark"
          ? "bg-gray-800/90 border-gray-700/50 shadow-gray-900/20"
          : "bg-white/90 border-gray-200/50 shadow-gray-900/10"
      }`}
    >
      <div
        className={`px-6 sm:px-8 py-6 border-b ${
          mode === "dark"
            ? "bg-gradient-to-r from-gray-700/80 to-purple-900/40 border-gray-700/50"
            : "bg-gradient-to-r from-gray-50/80 to-purple-50/40 border-gray-200/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon="solar:shop-bold" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className={`text-xl font-bold ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Store Assignment
              </h2>
              
              <p
                className={`text-sm ${
                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Your assigned workplace location
              </p>
            </div>
          </div>
          
        </div>
      </div>

      <div className="">
        <div
          className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${
            mode === "dark"
              ? "bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/30 shadow-lg shadow-blue-900/20"
              : "bg-gradient-to-br from-blue-50/80 to-purple-50/60 border-blue-200/50 shadow-lg shadow-blue-900/10"
          }`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4">
              <Icon
                icon="solar:shop-bold"
                className="w-24 h-24 text-blue-500"
              />
            </div>
          </div>

          <div className="relative p-6">
            {/* Store Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <h3
                  className={`text-lg font-bold mb-1 ${
                    mode === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Store Name: {" "}
                  {storeData ? (
                    storeData.name
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="solar:loading-bold"
                        className="w-4 h-4 animate-spin"
                      />
                      Loading store...
                    </div>
                  )}
                </h3>
              </div>
            </div>

            {/* Store Details Grid */}
            {storeData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Address */}
                {storeData.address && (
                  <div
                    className={`p-4 rounded-xl border ${
                      mode === "dark"
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-white/70 border-gray-200/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          mode === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                        }`}
                      >
                        <Icon
                          icon="solar:map-point-bold"
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium mb-1 ${
                            mode === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Address
                        </p>
                        <p
                          className={`text-sm font-medium leading-relaxed ${
                            mode === "dark" ? "text-gray-200" : "text-gray-800"
                          }`}
                        >
                          {storeData.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Store Phone */}
                {storeData.phone && (
                  <div
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      mode === "dark"
                        ? "bg-gray-800/50 border-gray-700/50 hover:border-green-600/50"
                        : "bg-white/70 border-gray-200/50 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          mode === "dark" ? "bg-green-900/50" : "bg-green-100"
                        }`}
                      >
                        <Icon
                          icon="solar:phone-bold"
                          className="w-4 h-4 text-green-600"
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-xs font-medium mb-1 ${
                            mode === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Phone
                        </p>
                        <a
                          href={`tel:${storeData.phone}`}
                          className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                            mode === "dark"
                              ? "text-green-400 hover:text-green-300"
                              : "text-green-600 hover:text-green-700"
                          }`}
                          title={`Call ${storeData.phone}`}
                        >
                          {storeData.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Store Status Footer */}
            <div
              className={`mt-6 pt-4 border-t flex items-center justify-between ${
                mode === "dark" ? "border-gray-700/50" : "border-gray-200/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span
                  className={`text-xs font-medium ${
                    mode === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Currently assigned
                </span>
              </div>
              <div
                className={`text-xs ${
                  mode === "dark" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Contact your manager for changes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
