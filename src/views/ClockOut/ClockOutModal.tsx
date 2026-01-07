// src/views/ClockOutModal.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { QueueEntry } from "../shared/types";
import { PinModal } from "../components/PinModal";

interface ClockOutModalProps {
    open: boolean;
    onClose: () => void;
    queue: QueueEntry[];
    onSuccess: () => void;
}

export function ClockOutModal({ open, onClose, queue, onSuccess }: ClockOutModalProps) {
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null);

    // Only show IDLE techs
    const idleTechs = queue.filter(entry => entry.status === "IDLE");

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
            onSuccess();
            setSelectedTechId(null);
            return true;
        } catch (error) {
            console.error("Failed to clock out tech:", error);
            return false;
        }
    };

    if (!open) return null;

    // Show PIN modal if a tech is selected
    if (selectedTechId !== null) {
        const tech = queue.find(e => e.staffId === selectedTechId);
        return (
            <PinModal
                open={true}
                onClose={() => setSelectedTechId(null)}
                onSubmit={handlePinSubmit}
                title="Clock-Out Authentication"
                subtitle={`Enter PIN to clock out ${tech?.name || "tech"}`}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-slate-800">Clock-Out Technicians</div>
                        <div className="text-sm text-slate-500 mt-1">
                            Select a tech to clock out (IDLE techs only)
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[500px] overflow-auto">
                    {idleTechs.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="text-slate-400 text-sm font-medium">
                                No idle techs available to clock out.
                            </div>
                            <div className="text-slate-400 text-xs mt-2">
                                Techs who are currently serving cannot be clocked out.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {idleTechs.map(tech => (
                                <div
                                    key={tech.staffId}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-200 text-slate-700 font-bold">
                                            {tech.order}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{tech.name}</div>
                                            <div className="text-xs text-slate-500">
                                                Order {tech.order} • {tech.turns} turn(s)
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTechId(tech.staffId)}
                                        className="h-9 px-5 rounded-xl bg-orange-600 text-white font-semibold shadow-sm hover:bg-orange-700 active:translate-y-[1px] transition"
                                    >
                                        Clock-out
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold shadow-sm hover:bg-slate-800 active:translate-y-[1px] transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
