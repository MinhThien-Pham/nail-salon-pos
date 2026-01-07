// src/views/ClockInModal.tsx
import { useEffect, useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { Staff } from "../shared/types";
import { PinModal } from "../components/PinModal";

interface ClockInModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClockInModal({ open, onClose, onSuccess }: ClockInModalProps) {
    const [step, setStep] = useState<"PIN" | "SELECT">("PIN");
    const [allTechs, setAllTechs] = useState<Staff[]>([]);
    const [selectedTechs, setSelectedTechs] = useState<Staff[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    useEffect(() => {
        if (!open) return;
        setStep("PIN");
        setSelectedTechs([]);
        setShowResetConfirm(false);
        setShowPinModal(true); // Show PIN modal when opening
    }, [open]);

    useEffect(() => {
        if (step === "SELECT") {
            loadTechs();
        }
    }, [step]);

    const loadTechs = async () => {
        const staff = await window.api.getAllStaff();
        const techs = staff.filter(s => s.roles.includes("TECH") && s.isActive);
        setAllTechs(techs);
    };

    const handlePinSubmit = async (pin: string): Promise<boolean> => {
        try {
            const staff = await window.api.verifyReceptionist(pin);
            if (!staff) return false;
            setShowPinModal(false); // Hide PIN modal
            setStep("SELECT"); // Move to tech selection
            return true;
        } catch {
            return false;
        }
    };

    const handleSelect = (tech: Staff) => {
        setSelectedTechs(prev => [...prev, tech]);
    };

    const handleDeselect = (tech: Staff) => {
        setSelectedTechs(prev => prev.filter(t => t.staffId !== tech.staffId));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newSelected = [...selectedTechs];
        [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
        setSelectedTechs(newSelected);
    };

    const handleMoveDown = (index: number) => {
        if (index === selectedTechs.length - 1) return;
        const newSelected = [...selectedTechs];
        [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
        setSelectedTechs(newSelected);
    };

    const handleSave = async () => {
        try {
            const staffIds = selectedTechs.map(t => t.staffId);
            await window.api.bulkAddTechsToQueue(staffIds);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add techs to queue:", error);
            alert("Failed to add techs to queue. Please try again.");
        }
    };

    const handleReset = async () => {
        try {
            await window.api.resetQueue();
            onSuccess();
            setShowResetConfirm(false);
            onClose();
        } catch (error) {
            console.error("Failed to reset queue:", error);
            alert("Failed to reset queue. Please try again.");
        }
    };

    useEffect(() => {
        // If PIN modal closes (showPinModal becomes false) but we're still on PIN step,
        // it means user cancelled, so close the parent modal
        if (!showPinModal && step === "PIN" && open) {
            onClose();
        }
    }, [showPinModal, step, open, onClose]);

    if (!open) return null;

    // Render PIN modal overlay if we're showing it
    if (showPinModal && step === "PIN") {
        return (
            <PinModal
                open={true}
                onClose={() => {
                    setShowPinModal(false);
                    // Don't close parent modal - just hide PIN and show tech selection
                }}
                onSubmit={handlePinSubmit}
                title="Clock-In Authentication"
                subtitle="Enter receptionist PIN to access clock-in"
            />
        );
    }

    const availableTechs = allTechs.filter(
        tech => !selectedTechs.some(s => s.staffId === tech.staffId)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-5xl h-[600px] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-bold text-slate-800">Clock-In Technicians</div>
                        <div className="text-sm text-slate-500 mt-1">
                            Select techs from the left and set their order on the right
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

                {/* Split screen content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Available Techs */}
                    <div className="flex-1 border-r border-slate-200 overflow-auto">
                        <div className="p-4">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                                Available Techs ({availableTechs.length})
                            </div>
                            <div className="space-y-2">
                                {availableTechs.map(tech => (
                                    <div
                                        key={tech.staffId}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{tech.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {tech.skillsTypeIds.length} skill(s)
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(tech)}
                                            className="h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition"
                                        >
                                            Select →
                                        </button>
                                    </div>
                                ))}
                                {availableTechs.length === 0 && (
                                    <div className="py-12 text-center text-sm text-slate-400">
                                        All techs have been selected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Selected Techs (ordered) */}
                    <div className="flex-1 overflow-auto bg-slate-50">
                        <div className="p-4">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                                Selected Queue ({selectedTechs.length})
                            </div>
                            <div className="space-y-2">
                                {selectedTechs.map((tech, index) => (
                                    <div
                                        key={tech.staffId}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                className="h-6 w-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                aria-label="Move up"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === selectedTechs.length - 1}
                                                className="h-6 w-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                                aria-label="Move down"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{tech.name}</div>
                                            <div className="text-xs text-slate-500">Order {index + 1}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeselect(tech)}
                                            className="h-8 px-4 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 active:translate-y-[1px] transition"
                                        >
                                            ← Remove
                                        </button>
                                    </div>
                                ))}
                                {selectedTechs.length === 0 && (
                                    <div className="py-12 text-center text-sm text-slate-400">
                                        Select techs from the left to add to the queue
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with actions */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="h-10 px-5 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 active:translate-y-[1px] transition"
                    >
                        Reset Queue
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-5 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={selectedTechs.length === 0}
                            className="h-10 px-5 rounded-xl bg-green-600 text-white font-semibold shadow-sm hover:bg-green-700 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <div className="text-xl font-bold text-slate-800 mb-2">Reset Queue?</div>
                        <div className="text-sm text-slate-600 mb-6">
                            This will remove all techs from the queue. This action cannot be undone.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 h-10 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex-1 h-10 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
