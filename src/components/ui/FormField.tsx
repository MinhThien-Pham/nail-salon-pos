import { InputHTMLAttributes } from 'react';
import { Input } from './Input';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    required?: boolean;
    helperText?: string;
}

export function FormField({
    label,
    error,
    required,
    helperText,
    className = '',
    ...inputProps
}: FormFieldProps) {
    return (
        <div className={className}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <Input
                error={!!error}
                {...inputProps}
            />

            {error && (
                <small className="text-red-500 text-xs mt-1 block">
                    {error}
                </small>
            )}

            {helperText && !error && (
                <small className="text-slate-500 text-xs mt-1 block">
                    {helperText}
                </small>
            )}
        </div>
    );
}
