import { ReactNode } from 'react';

export interface BadgeProps {
    variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate' | 'pink';
    size?: 'sm' | 'md';
    children: ReactNode;
    className?: string;
}

export function Badge({
    variant = 'blue',
    size = 'sm',
    children,
    className = ''
}: BadgeProps) {
    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    // Variant classes
    const variantClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
        pink: 'bg-pink-50 text-pink-700 border-pink-200',
    };

    const baseClasses = 'inline-flex items-center justify-center rounded-full font-semibold border';

    const combinedClasses = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={combinedClasses}>
            {children}
        </span>
    );
}
