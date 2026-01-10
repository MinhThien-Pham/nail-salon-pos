// src/views/QueueView.tsx
import { useEffect, useState } from "react";
import { QueueEntry, ServiceType } from "../../shared/types";
import { DollarSign } from "lucide-react";
import { Button } from "../../components/ui";
import { CheckoutView } from "../Checkout/CheckoutView";

interface QueueViewProps {
    queueTab: "LIST" | "BOXES";
}

export function QueueView({ queueTab }: QueueViewProps) {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<number | null>(null); // null = All
    const [longPressTarget, setLongPressTarget] = useState<number | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);


    // Load initial data
    useEffect(() => {
        loadQueue();
        loadServiceTypes();
    }, []);

    const loadQueue = async () => {
        const data = await window.api.getQueueState();
        setQueue(data);
    };

    const loadServiceTypes = async () => {
        const types = await window.api.getServiceTypes();
        setServiceTypes(types);
    };

    const handleStart = async (staffId: number) => {
        try {
            await window.api.updateTechStatus(staffId, "SERVING");
            await loadQueue();
        } catch (error) {
            console.error("Failed to start serving:", error);
        }
    };

    const handleMouseDown = (staffId: number) => {
        const timer = setTimeout(() => {
            setLongPressTarget(staffId);
        }, 2000); // 2 seconds
        setLongPressTimer(timer);
    };

    const handleMouseUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // Filter queue based on selected service type
    const filteredQueue = selectedFilter === null
        ? queue
        : queue.filter(entry => entry.skillsTypeIds.includes(selectedFilter));

    // For debugging/future feature
    if (queueTab === "BOXES") {
        return (
            <div className="h-full flex flex-col gap-6 p-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <div className="text-lg font-semibold mb-2">Boxes View</div>
                    <div className="text-sm text-slate-500">(Will be implemented later)</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="h-full flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    {/* Left: Title */}
                    <div className="w-[140px]">
                        <h2 className="text-3xl font-bold text-slate-800">Queue</h2>
                    </div>

                    {/* Center: Tabs and Service Filter Pills */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        {/* Tab bar */}
                        <div className="flex bg-white p-1 h-auto rounded-xl shadow-sm border border-slate-200/60 w-[300px]">
                            <button
                                onClick={() => {/* Switch to Turn List */ }}
                                className={[
                                    "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
                                    queueTab === "LIST"
                                        ? "bg-blue-50 text-blue-700 shadow-none"
                                        : "text-slate-400 hover:text-slate-600"
                                ].join(" ")}
                            >
                                Turn List
                            </button>
                            <button
                                onClick={() => {/* Switch to Boxes */ }}
                                className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all"
                            >
                                Boxes
                            </button>
                        </div>

                        {/* Service type filter pills */}
                        <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/40">
                            <button
                                type="button"
                                onClick={() => setSelectedFilter(null)}
                                className={[
                                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                    selectedFilter === null
                                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                                        : "text-slate-400 hover:text-slate-600",
                                ].join(" ")}
                            >
                                All
                            </button>
                            {serviceTypes.map(type => (
                                <button
                                    key={type.serviceTypeId}
                                    type="button"
                                    onClick={() => setSelectedFilter(type.serviceTypeId)}
                                    className={[
                                        "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                        selectedFilter === type.serviceTypeId
                                            ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                                            : "text-slate-400 hover:text-slate-600",
                                    ].join(" ")}
                                >
                                    {type.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Checkout Button */}
                    <div className="w-[140px] flex justify-end">
                        <Button
                            variant="blue"
                            className="gap-2 shadow-lg shadow-blue-600/20"
                            onClick={() => setShowCheckout(true)}
                        >
                            <DollarSign className="w-4 h-4" /> Checkout
                        </Button>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-4">Tech</div>
                        <div className="col-span-2 text-center">Turns</div>
                        <div className="col-span-5 text-right">Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-auto">
                        {filteredQueue.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="text-slate-400 text-sm font-medium">
                                    {queue.length === 0
                                        ? "No techs clocked in. Click Clock-in to add techs to the queue."
                                        : "No techs available for the selected service type."}
                                </div>
                            </div>
                        ) : (
                            filteredQueue.map((entry, index) => {
                                // Get initials from name
                                const initials = entry.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .substring(0, 2);

                                // All avatars use same blue color
                                const avatarColor = 'text-[rgb(29,78,216)]';

                                // Alternate background for rows based on index
                                const rowBg = index % 2 === 0 ? "bg-white" : "bg-blue-50/30";

                                // Gray out entire row when busy/serving
                                const isBusy = entry.status === "SERVING";
                                const rowStyle = isBusy ? "grayscale opacity-50" : "";

                                return (
                                    <div
                                        key={entry.staffId}
                                        className={`grid grid-cols-12 gap-4 px-8 py-5 items-center border-b border-slate-100 last:border-0 transition-all ${rowBg} ${rowStyle}`}
                                    >
                                        {/* Order */}
                                        <div className="col-span-1 text-center font-medium text-slate-400">
                                            {entry.order}.
                                        </div>

                                        {/* Tech Info */}
                                        <div className="col-span-4 font-bold text-lg flex items-center gap-3 text-slate-800">
                                            {/* Avatar */}
                                            <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 border border-blue-200 ${avatarColor} font-bold text-sm`}>
                                                {initials}
                                            </div>
                                            {/* Name and skills */}
                                            <div className="flex flex-col">
                                                <span>{entry.name}</span>
                                                <div className="flex gap-1 mt-0.5">
                                                    {entry.skillsTypeIds.map(skillId => {
                                                        const skillType = serviceTypes.find(st => st.serviceTypeId === skillId);
                                                        if (!skillType) return null;
                                                        return (
                                                            <span
                                                                key={skillId}
                                                                className="text-[8px] px-1 py-0.5 rounded-sm bg-slate-100 text-slate-500 border border-slate-200/50 uppercase tracking-tighter"
                                                            >
                                                                {skillType.name}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Turns */}
                                        <div className="col-span-2 text-center font-bold text-slate-900 text-lg">
                                            {entry.turns}
                                        </div>

                                        {/* Action */}
                                        <div className="col-span-5 text-right">
                                            {entry.status === "IDLE" ? (
                                                <Button
                                                    variant="slate"
                                                    size="md"
                                                    onClick={() => handleStart(entry.staffId)}
                                                    className="min-h-9 py-2 px-6"
                                                >
                                                    Start
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="slate"
                                                    size="md"
                                                    onMouseDown={() => handleMouseDown(entry.staffId)}
                                                    onMouseUp={handleMouseUp}
                                                    onMouseLeave={handleMouseUp}
                                                    className="min-h-9 py-2 px-6 cursor-not-allowed"
                                                    disabled
                                                    title="Tech is currently serving (Long press to revert to idle)"
                                                >
                                                    Start
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* PIN Modal for reverting SERVING to IDLE */}
            {longPressTarget !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
                        <div className="text-xl font-bold text-slate-800 mb-4">
                            Revert to Idle
                        </div>
                        <div className="text-sm text-slate-600 mb-6">
                            Enter your PIN to change status back to idle.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setLongPressTarget(null)}
                                className="flex-1 h-10 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <CheckoutView onClose={() => setShowCheckout(false)} />
            )}
        </>
    );
}
