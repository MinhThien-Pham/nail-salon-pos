// src/views/ClockInView.tsx
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { Staff } from "../../shared/types";

export function ClockInView() {
    const [allTechs, setAllTechs] = useState<Staff[]>([]);
    const [selectedTechs, setSelectedTechs] = useState<Staff[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showDeselectWarning, setShowDeselectWarning] = useState(false);
    const [techToDeselect, setTechToDeselect] = useState<Staff | null>(null);
    const [originalQueueOrder, setOriginalQueueOrder] = useState<number[]>([]); // Track original staff IDs in order

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        // Load techs when component mounts
        loadTechs();
    }, []);

    const loadTechs = async () => {
        // Load all staff
        const staff = await window.api.getAllStaff();
        const techs = staff.filter(s => s.roles.includes("TECH") && s.isActive);
        setAllTechs(techs);

        // Load current queue state from database
        const currentQueue = await window.api.getQueueState();

        // Populate selected techs with those already in the queue
        if (currentQueue.length > 0) {
            // Map queue entries back to Staff objects with proper order
            const selectedFromQueue = currentQueue
                .sort((a, b) => a.order - b.order)
                .map(queueEntry => {
                    const staffMember = techs.find(t => t.staffId === queueEntry.staffId);
                    if (staffMember) {
                        // Attach the turn count so we can check it later
                        return { ...staffMember, currentTurns: queueEntry.turns };
                    }
                    return null;
                })
                .filter(Boolean) as (Staff & { currentTurns?: number })[];

            setSelectedTechs(selectedFromQueue);

            // Store original order for change detection
            setOriginalQueueOrder(selectedFromQueue.map(t => t.staffId));
        } else {
            setOriginalQueueOrder([]);
        }
    };

    const handleSelect = (tech: Staff) => {
        setSelectedTechs(prev => [...prev, tech]);
    };

    const handleDeselect = (tech: Staff & { currentTurns?: number }) => {
        // Check if this tech has turns > 0
        if (tech.currentTurns && tech.currentTurns > 0) {
            setTechToDeselect(tech);
            setShowDeselectWarning(true);
        } else {
            // No turns, just deselect
            setSelectedTechs(prev => prev.filter(t => t.staffId !== tech.staffId));
        }
    };

    const confirmDeselect = () => {
        if (techToDeselect) {
            setSelectedTechs(prev => prev.filter(t => t.staffId !== techToDeselect.staffId));
        }
        setShowDeselectWarning(false);
        setTechToDeselect(null);
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null) return;

        const newSelected = [...selectedTechs];
        const [draggedItem] = newSelected.splice(draggedIndex, 1);
        newSelected.splice(dropIndex, 0, draggedItem);

        setSelectedTechs(newSelected);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleReset = async () => {
        try {
            await window.api.resetQueue();
            await window.api.deleteAllCheckoutSplits();
            setSelectedTechs([]);
            setOriginalQueueOrder([]);
            setShowResetConfirm(false);
        } catch (error) {
            console.error("Failed to reset queue:", error);
        }
    };

    const handleSave = async () => {
        try {
            // Fetch the latest queue state from DB first
            const latestQueue = await window.api.getQueueState();

            // Build a map of staffId -> latest data from database
            const latestDataMap = new Map(
                latestQueue.map(entry => [entry.staffId, entry])
            );

            // Map selectedTechs to queue entries, preserving turns/status if they exist
            const queueEntries = selectedTechs.map((tech, index) => {
                const existingEntry = latestDataMap.get(tech.staffId);
                return {
                    staffId: tech.staffId,
                    name: tech.name,
                    order: index + 1,
                    status: existingEntry?.status ?? "IDLE" as const,
                    turns: existingEntry?.turns ?? 0,
                    skillsTypeIds: tech.skillsTypeIds,
                };
            });

            await window.api.saveQueueState(queueEntries);

            // Update originalQueueOrder to match new state (disable Save button)
            setOriginalQueueOrder(selectedTechs.map(t => t.staffId));

            // Optionally navigate back
            // window.history.back();
        } catch (error) {
            console.error("Failed to save queue:", error);
        }
    };

    // Check if current selection differs from original database state
    const hasChanges = (() => {
        const currentOrder = selectedTechs.map(t => t.staffId);

        // Different length means changes
        if (currentOrder.length !== originalQueueOrder.length) return true;

        // Same length, check if order is identical
        return !currentOrder.every((id, index) => id === originalQueueOrder[index]);
    })();

    const availableTechs = allTechs.filter(
        tech => !selectedTechs.some(s => s.staffId === tech.staffId)
    );

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="w-[140px]">
                    <h2 className="text-3xl font-bold text-slate-800">Clock-In</h2>
                </div>

                {/* Center: Empty for symmetry */}
                <div className="flex-1 flex flex-col items-center gap-4">
                    {/* Optional: could add filters or tabs here later */}
                </div>

                {/* Right: Action Buttons */}
                <div className="w-[200px] flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/20 font-semibold px-6 whitespace-nowrap active:translate-y-[1px]"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold px-8 whitespace-nowrap active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                {/* Split screen content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Available Techs */}
                    <div className="flex-1 border-r border-slate-200 overflow-auto">
                        <div className="p-6">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                                Available Techs ({availableTechs.length})
                            </div>
                            <div className="space-y-3">
                                {availableTechs.map(tech => (
                                    <div
                                        key={tech.staffId}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{tech.name}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(tech)}
                                            className="h-9 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition"
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
                        <div className="p-6">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                                Selected Queue ({selectedTechs.length})
                            </div>
                            <div className="space-y-3">
                                {selectedTechs.map((tech, index) => (
                                    <div
                                        key={tech.staffId}
                                        draggable={false}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className={[
                                            "flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition",
                                            draggedIndex === index ? "opacity-50" : "",
                                            dragOverIndex === index && draggedIndex !== index ? "border-blue-500 border-2" : ""
                                        ].join(" ")}
                                    >
                                        {/* Drag Handle */}
                                        <div
                                            draggable={true}
                                            onDragStart={() => handleDragStart(index)}
                                            onDragEnd={handleDragEnd}
                                            className="cursor-grab active:cursor-grabbing"
                                        >
                                            <GripVertical className="h-5 w-5 text-slate-400" />
                                        </div>

                                        {/* Order Number */}
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                            {index + 1}
                                        </div>

                                        {/* Tech Info */}
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{tech.name}</div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeselect(tech)}
                                            className="h-9 px-5 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-red-100 hover:text-red-600 active:translate-y-[1px] transition"
                                        >
                                            ← Remove
                                        </button>
                                    </div>
                                ))}
                                {selectedTechs.length === 0 && (
                                    <div className="py-12 text-center text-sm text-slate-400">
                                        Select techs from the left to add them to the queue
                                    </div>
                                )}
                            </div>
                        </div>
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

            {/* Deselect Warning Modal */}
            {showDeselectWarning && techToDeselect && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <div className="text-xl font-bold text-slate-800 mb-2">Warning: Tech Has Turns</div>
                        <div className="text-sm text-slate-600 mb-6">
                            <strong>{techToDeselect.name}</strong> has completed{" "}
                            <strong>{(techToDeselect as any).currentTurns} turn(s)</strong>. If you deselect this tech, their turn count will be reset to 0 if they are selected again.
                            <br /><br />
                            <strong>Tip:</strong> Use drag-and-drop to reorder techs instead if you just want to change their position in the queue.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeselectWarning(false);
                                    setTechToDeselect(null);
                                }}
                                className="flex-1 h-10 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                            >
                                Keep in Queue
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeselect}
                                className="flex-1 h-10 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
                            >
                                Deselect Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
