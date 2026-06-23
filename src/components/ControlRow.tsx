import React, { useState, useEffect } from 'react';

interface ControlRowProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  displayPrecision: number;
}

export const ControlRow: React.FC<ControlRowProps> = ({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
  displayPrecision,
}) => {
  // Decouple input state for precise manual typing
  const [textVal, setTextVal] = useState<string>(value.toFixed(displayPrecision));

  // Sync local text input when global value changes (e.g. via preset or slider drag)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTextVal(value.toFixed(displayPrecision));
  }, [value, displayPrecision]);

  const commitValue = () => {
    const parsed = parseFloat(textVal);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setTextVal(clamped.toFixed(displayPrecision));
    } else {
      // Revert to current valid value if input is empty or invalid
      setTextVal(value.toFixed(displayPrecision));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      e.currentTarget.blur();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-2 py-1 select-none">
      {/* Label and Manual Numeric Input */}
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-zinc-400 tracking-widest uppercase flex items-center gap-1.5">
          {icon && <span className="text-zinc-500">{icon}</span>}
          {label}
        </span>
        <input 
          type="text" 
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          className="w-16 bg-[#040406] border border-zinc-800 rounded px-2 py-0.5 text-right text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
      </div>

      {/* Sleek Line Slider */}
      <div className="py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="minimal-slider touch-none"
        />
      </div>
    </div>
  );
};
