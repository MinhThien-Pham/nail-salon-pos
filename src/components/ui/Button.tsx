import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'slate' | 'green' | 'blue' | 'red';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    children: ReactNode;
    fullWidth?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    fullWidth = false,
    type = 'button',
    ...props
}: ButtonProps) {
    // Base classes - always applied
    const baseClasses = 'inline-flex items-center justify-center gap-2 transition-colors font-semibold rounded-xl active:translate-y-[1px]';

    // Size variants
    const sizeClasses = {
        xs: 'h-7 px-3 text-xs',
        sm: 'h-8 px-4 text-xs',
        md: 'h-10 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
    };

    // Variant styles
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
        danger: 'bg-red-50 hover:bg-red-100 text-red-600',
        success: 'bg-green-50 hover:bg-green-100 text-green-700',
        slate: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
        green: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
        blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        red: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : '';

    // Combine all classes
    const combinedClasses = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        widthClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={combinedClasses}
            {...props}
        >
            {children}
        </button>
    );
}
