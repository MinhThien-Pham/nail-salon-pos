// src/views/GiftCardView.tsx
import { useState } from "react";

export function GiftCardView() {
    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="w-[200px]">
                    <h2 className="text-3xl font-bold text-slate-800">Gift Cards</h2>
                </div>

                {/* Center: Empty for symmetry */}
                <div className="flex-1 flex flex-col items-center gap-4">
                    {/* Optional: could add filters or tabs here later */}
                </div>

                {/* Right: Action Buttons */}
                <div className="w-[200px] flex justify-end gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold px-6 whitespace-nowrap active:translate-y-[1px]"
                    >
                        New Gift Card
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-slate-400 text-lg font-medium mb-2">
                                Gift Card Management
                            </div>
                            <div className="text-slate-400 text-sm">
                                (Feature will be implemented later.)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
