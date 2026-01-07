// src/views/Calendar/CalendarView.tsx
import { useState, useEffect } from 'react';
import type { QueueEntry } from '../../shared/types';
import { Button } from '../../components/ui';

export function CalendarView() {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadQueue();

        // Update current time every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const loadQueue = async () => {
        try {
            const state = await window.api.getQueueState();
            setQueue(state || []);
        } catch (err) {
            console.error('Failed to load queue:', err);
        }
    };

    // Generate time slots from 9:00 AM to 6:00 PM in 15-minute increments
    const generateTimeSlots = () => {
        const slots: string[] = [];
        for (let hour = 9; hour < 18; hour++) {
            slots.push(formatTime(hour, 0));
            slots.push(formatTime(hour, 15));
            slots.push(formatTime(hour, 30));
            slots.push(formatTime(hour, 45));
        }
        return slots;
    };

    const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    };

    // Calculate position of current time indicator
    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();

        // Calculate total minutes from 9:00 AM
        const minutesFromStart = (hours - 9) * 60 + minutes;

        // Each time slot is 15 minutes, total slots is from 9:00 AM to 6:00 PM (9 hours = 36 slots)
        const totalMinutes = 9 * 60; // 9 hours

        // Calculate percentage position
        if (minutesFromStart < 0 || minutesFromStart > totalMinutes) {
            return null; // Outside business hours
        }

        return (minutesFromStart / totalMinutes) * 100;
    };

    const timeSlots = generateTimeSlots();
    const sortedQueue = [...queue].sort((a, b) => a.order - b.order);
    const currentTimePosition = getCurrentTimePosition();

    return (
        <div className="h-full flex flex-col">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                {/* Left: Title */}
                <div className="w-[200px]">
                    <h2 className="text-3xl font-bold text-slate-800">Calendar</h2>
                </div>

                {/* Center: Empty for symmetry */}
                <div className="flex-1"></div>

                {/* Right: Add Appointment Button */}
                <div className="w-[200px] flex justify-end">
                    <Button variant="blue" className="shadow-lg shadow-blue-600/20">
                        Add Appointment
                    </Button>
                </div>
            </div>

            {/* Calendar Grid Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-auto relative">
                    {/* Calendar Grid */}
                    <div className="min-w-full inline-block align-middle">
                        <div className="overflow-hidden relative">
                            {/* Grid Header - Tech Names */}
                            <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                                <div className="grid" style={{ gridTemplateColumns: `100px repeat(${sortedQueue.length + 1}, 1fr)` }}>
                                    {/* Time column header */}
                                    <div className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200">
                                        Time
                                    </div>

                                    {/* Unassigned column */}
                                    <div className="px-4 py-3 text-center text-sm font-bold text-slate-600 border-r border-slate-200">
                                        Unassigned
                                    </div>

                                    {/* Tech columns */}
                                    {sortedQueue.map((tech, index) => (
                                        <div
                                            key={tech.staffId}
                                            className={`px-4 py-3 text-center text-sm font-bold text-slate-800 ${index < sortedQueue.length - 1 ? 'border-r border-slate-200' : ''}`}
                                        >
                                            {tech.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Grid Body - Time Slots */}
                            <div className="relative">
                                {timeSlots.map((timeSlot, rowIndex) => (
                                    <div
                                        key={timeSlot}
                                        className={`grid ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20 transition-colors`}
                                        style={{ gridTemplateColumns: `100px repeat(${sortedQueue.length + 1}, 1fr)` }}
                                    >
                                        {/* Time cell */}
                                        <div className="px-4 py-8 text-xs font-medium text-slate-500 border-r border-b border-slate-100">
                                            {timeSlot}
                                        </div>

                                        {/* Unassigned cell */}
                                        <div className="px-2 py-8 border-r border-b border-slate-100 min-h-[80px] relative">
                                            {/* Empty slot for appointments */}
                                        </div>

                                        {/* Tech cells */}
                                        {sortedQueue.map((tech, colIndex) => (
                                            <div
                                                key={`${tech.staffId}-${timeSlot}`}
                                                className={`px-2 py-8 border-b border-slate-100 min-h-[80px] relative ${colIndex < sortedQueue.length - 1 ? 'border-r' : ''}`}
                                            >
                                                {/* Empty slot for appointments */}
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {/* Current Time Indicator */}
                                {currentTimePosition !== null && (
                                    <div
                                        className="absolute left-0 right-0 z-20 pointer-events-none"
                                        style={{ top: `${currentTimePosition}%` }}
                                    >
                                        <div className="relative">
                                            {/* Red line */}
                                            <div className="h-0.5 bg-red-500 shadow-lg shadow-red-500/50"></div>
                                            {/* Red dot at the start */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
