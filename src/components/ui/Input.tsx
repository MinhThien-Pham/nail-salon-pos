import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ error, fullWidth = true, className = '', ...props }, ref) => {
        const baseClasses = 'h-10 px-3 rounded-xl border text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white';
        const errorClasses = error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500';
        const widthClass = fullWidth ? 'w-full' : '';

        const combinedClasses = [baseClasses, errorClasses, widthClass, className]
            .filter(Boolean)
            .join(' ');

        return (
            <input
                ref={ref}
                className={combinedClasses}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
