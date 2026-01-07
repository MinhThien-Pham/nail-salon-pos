// src/components/PinModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Delete, X } from "lucide-react";

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean>; // true if success
  title?: string;

  // optional (won’t break existing calls)
  subtitle?: string;
  pinLength?: number; // default 6
}

export function PinModal({
  open,
  onClose,
  onSubmit,
  title = "Enter PIN",
  subtitle = "Please enter your 6-digit code to access settings",
  pinLength = 6,
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const dots = useMemo(() => Array.from({ length: pinLength }), [pinLength]);

  // Reset each time we open
  useEffect(() => {
    if (!open) return;
    setPin("");
    setError("");
    setSubmitting(false);

    // focus close for keyboard users
    setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, [open]);

  // Auto-submit when full (matches Replit behavior, but we validate before closing)
  useEffect(() => {
    if (!open) return;
    if (pin.length !== pinLength) return;
    if (submitting) return;

    const run = async () => {
      setSubmitting(true);
      try {
        const ok = await onSubmit(pin);
        if (ok) {
          setPin("");
          setError("");
          onClose();
          return;
        }
        setError("Incorrect PIN.");
        setPin("");
      } catch {
        setError("Error verifying PIN.");
        setPin("");
      } finally {
        setSubmitting(false);
      }
    };

    // tiny delay feels nicer (same idea as Replit)
    const t = setTimeout(run, 150);
    return () => clearTimeout(t);
  }, [open, pin, pinLength, submitting, onClose, onSubmit]);

  if (!open) return null;

  const append = (digit: string) => {
    if (submitting) return;
    if (pin.length >= pinLength) return;
    setError("");
    setPin((p) => p + digit);
  };

  const backspace = () => {
    if (submitting) return;
    setError("");
    setPin((p) => p.slice(0, -1));
  };

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // close only if user clicked the overlay itself (not the dialog)
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (submitting) return;

    if (e.key === "Escape") onClose();
    if (e.key === "Backspace") backspace();

    // allow typing digits
    if (/^\d$/.test(e.key)) append(e.key);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onOverlayMouseDown}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Close (top-right) */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-10 pb-10 pt-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 pb-6">
            <div className="text-3xl font-bold text-slate-800">{title}</div>
            <div className="text-sm font-medium text-slate-400 text-center">
              {subtitle}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-4 pb-8">
            {dots.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-4 w-4 rounded-full transition-all duration-200",
                  pin.length > i ? "bg-blue-600 scale-110" : "bg-slate-200",
                  error ? "bg-red-400" : "",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Keypad (match Replit: ghost buttons, rounded-2xl, no big Enter button) */}
          <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-4">
            {["1","2","3","4","5","6","7","8","9"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => append(n)}
                disabled={submitting}
                className="h-16 w-16 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              >
                {n}
              </button>
            ))}

            <div className="flex items-center justify-center" />

            <button
              type="button"
              onClick={() => append("0")}
              disabled={submitting}
              className="h-16 w-16 rounded-2xl text-2xl font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              onClick={backspace}
              disabled={submitting}
              aria-label="Delete digit"
              className="h-16 w-16 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 flex items-center justify-center"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="pt-6 text-center text-sm font-medium text-red-500" aria-live="polite">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
