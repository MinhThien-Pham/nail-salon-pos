// src/views/Calendar/CalendarView.tsx
export function CalendarView() {
    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="w-[200px]">
                    <h2 className="text-3xl font-bold text-slate-800">Calendar</h2>
                </div>

                {/* Center: Empty for symmetry */}
                <div className="flex-1 flex flex-col items-center gap-4">
                    {/* Optional: could add filters or tabs here later */}
                </div>

                {/* Right: Actions */}
                <div className="w-[200px] flex justify-end gap-2">
                    {/* Future: Add actions like New Appointment, etc. */}
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-slate-400 text-lg font-medium mb-2">
                                Calendar Management
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
