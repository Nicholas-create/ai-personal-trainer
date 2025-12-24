'use client';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export default function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
}: StepperProps) {
  const decrease = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const increase = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={decrease}
        disabled={disabled || value <= min}
        className="w-14 h-14 flex items-center justify-center text-2xl text-blue-600 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="flex-1 text-center">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <button
        onClick={increase}
        disabled={disabled || value >= max}
        className="w-14 h-14 flex items-center justify-center text-2xl text-blue-600 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
