// src/views/ClockOutView.tsx
import { useEffect, useState } from "react";
import { QueueEntry } from "../../shared/types";
import { PinModal } from "../../components/PinModal";

export function ClockOutView() {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
    const [batchMode, setBatchMode] = useState(false);
    const [showBatchPinModal, setShowBatchPinModal] = useState(false);

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        const data = await window.api.getQueueState();
        setQueue(data);
    };

    const handleBatchModeActivation = async (pin: string): Promise<boolean> => {
        try {
            const staff = await window.api.verifyReceptionist(pin);
            if (!staff) return false;

            setBatchMode(true);
            setShowBatchPinModal(false);
            return true;
        } catch (error) {
            console.error("Failed to activate batch mode:", error);
            return false;
        }
    };

    const handleCancelBatchMode = () => {
        setBatchMode(false);
    };

    const handleTechClockOut = async (techId: number) => {
        if (batchMode) {
            // In batch mode, clock out immediately without PIN
            try {
                await window.api.removeTechFromQueue(techId);
                await loadQueue();
            } catch (error) {
                console.error("Failed to clock out tech:", error);
            }
        } else {
            // Normal mode, show PIN modal
            setSelectedTechId(techId);
        }
    };

    const handlePinSubmit = async (pin: string): Promise<boolean> => {
        if (!selectedTechId) return false;

        try {
            const staff = await window.api.verifyPin(pin);
            if (!staff) return false;

            // Valid if RECEPTIONIST or same tech
            const isReceptionist = staff.roles.includes("RECEPTIONIST");
            const isSameTech = staff.staffId === selectedTechId;

            if (!isReceptionist && !isSameTech) return false;

            await window.api.removeTechFromQueue(selectedTechId);
            setSelectedTechId(null);
            await loadQueue();
            return true;
        } catch (error) {
            console.error("Failed to clock out tech:", error);
            return false;
        }
    };

    // Only show IDLE techs
    const idleTechs = queue.filter(entry => entry.status === "IDLE");

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="w-[140px]">
                    <h2 className="text-3xl font-bold text-slate-800">Clock-Out</h2>
                </div>

                {/* Center: Empty for symmetry */}
                <div className="flex-1 flex flex-col items-center gap-4">
                    {/* Optional: could add filters or tabs here later */}
                </div>

                {/* Right: Batch Mode Button */}
                <div className="w-[140px] flex justify-end">
                    {batchMode ? (
                        <button
                            type="button"
                            onClick={handleCancelBatchMode}
                            className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-600/20 font-semibold px-6 whitespace-nowrap active:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowBatchPinModal(true)}
                            className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold px-6 whitespace-nowrap active:translate-y-[1px]"
                        >
                            Batch Mode
                        </button>
                    )}
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {idleTechs.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-slate-400 text-lg font-medium mb-2">
                                    No idle techs available to clock out.
                                </div>
                                <div className="text-slate-400 text-sm">
                                    Techs who are currently serving cannot be clocked out.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-3">
                                {idleTechs.map(tech => {
                                    // Get initials from name
                                    const initials = tech.name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .substring(0, 2);

                                    return (
                                        <div
                                            key={tech.staffId}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-700 text-lg font-bold">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 text-lg">{tech.name}</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleTechClockOut(tech.staffId)}
                                                className={`h-10 px-6 rounded-xl text-white font-semibold shadow-sm active:translate-y-[1px] transition ${batchMode
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : "bg-orange-600 hover:bg-orange-700"
                                                    }`}
                                            >
                                                {batchMode ? "Quick Clock-out" : "Clock-out"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Batch Mode PIN Modal */}
            {showBatchPinModal && (
                <PinModal
                    open={true}
                    onClose={() => setShowBatchPinModal(false)}
                    onSubmit={handleBatchModeActivation}
                    title="Batch Mode Authentication"
                    subtitle="Enter receptionist PIN to enable batch clock-out"
                />
            )}

            {/* Regular PIN Modal for individual clock-out */}
            {selectedTechId !== null && (
                <PinModal
                    open={true}
                    onClose={() => setSelectedTechId(null)}
                    onSubmit={handlePinSubmit}
                    title="Clock-Out Authentication"
                    subtitle={`Enter PIN to clock out ${queue.find(e => e.staffId === selectedTechId)?.name || "tech"}`}
                />
            )}
        </div>
    );
}
