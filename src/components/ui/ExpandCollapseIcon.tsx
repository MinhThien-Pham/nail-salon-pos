import { ChevronRight, ChevronDown } from 'lucide-react';

export interface ExpandCollapseIconProps {
    isExpanded: boolean;
    className?: string;
}

export function ExpandCollapseIcon({ isExpanded, className = '' }: ExpandCollapseIconProps) {
    return (
        <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 transition-all hover:bg-blue-200 ${className}`}>
            {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
            ) : (
                <ChevronRight className="w-4 h-4" />
            )}
        </div>
    );
}
