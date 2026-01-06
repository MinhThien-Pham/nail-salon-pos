import { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean>; // Returns true if success
  title?: string;
}

export function PinModal({ open, onClose, onSubmit, title = "Enter PIN" }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!open) return null;

  const handleNum = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleSubmit = async () => {
    const success = await onSubmit(pin);
    if (success) {
      setPin("");
      onClose();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[320px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex justify-center gap-2 mb-8 h-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? 'bg-blue-600 scale-125' : 'bg-slate-200'} ${error ? 'bg-red-500' : ''}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleNum(num.toString())} className="h-16 text-2xl font-semibold text-slate-700 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600">
              {num}
            </button>
          ))}
          <div />
          <button onClick={() => handleNum("0")} className="h-16 text-2xl font-semibold text-slate-700 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600">0</button>
          <button onClick={() => setPin(prev => prev.slice(0, -1))} className="h-16 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500"><Delete size={24} /></button>
        </div>

        <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl">Enter</button>
      </div>
    </div>
  );
}