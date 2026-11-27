import React, { useEffect, useState } from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  'aria-label'?: string;
  placeholder?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step,
  className = '',
  'aria-label': ariaLabel,
  placeholder,
}) => {
  const [text, setText] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  const clamp = (n: number) => {
    let res = n;
    if (min !== undefined && res < min) res = min;
    if (max !== undefined && res > max) res = max;
    return res;
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === '' || raw === '-') return;
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) {
          onChange(clamp(parsed));
        }
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseInt(text, 10);
        if (Number.isNaN(parsed)) {
          setText(String(value));
        } else {
          const finalVal = clamp(parsed);
          setText(String(finalVal));
          onChange(finalVal);
        }
      }}
    />
  );
};
