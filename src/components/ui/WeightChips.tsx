'use client';

import { useState } from 'react';

interface WeightChipsProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const COMMON_WEIGHTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function WeightChips({
  value,
  onChange,
  disabled = false,
}: WeightChipsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState(value.toString());

  // Get relevant weight options based on current value
  const getWeightOptions = () => {
    if (value === 0) return COMMON_WEIGHTS.slice(0, 5);

    const nearbyWeights = COMMON_WEIGHTS.filter(
      (w) => Math.abs(w - value) <= 15
    );

    if (!nearbyWeights.includes(value)) {
      nearbyWeights.push(value);
      nearbyWeights.sort((a, b) => a - b);
    }

    return nearbyWeights.slice(0, 5);
  };

  const handleCustomSubmit = () => {
    const numValue = parseInt(customValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
      setShowCustom(false);
    }
  };

  if (showCustom) {
    return (
      <div className="flex gap-2">
        <input
          type="number"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          className="flex-1 text-center text-xl font-bold border-2 border-blue-600 rounded-xl p-3"
          autoFocus
          min={0}
          disabled={disabled}
        />
        <button
          onClick={handleCustomSubmit}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold"
        >
          OK
        </button>
        <button
          onClick={() => setShowCustom(false)}
          disabled={disabled}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {getWeightOptions().map((weight) => (
        <button
          key={weight}
          onClick={() => onChange(weight)}
          disabled={disabled}
          className={`px-4 py-3 rounded-xl text-lg font-semibold transition-all ${
            value === weight
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {weight}
        </button>
      ))}
      <button
        onClick={() => setShowCustom(true)}
        disabled={disabled}
        className="px-4 py-3 rounded-xl text-lg font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
      >
        Other
      </button>
    </div>
  );
}
