import React from 'react';
import { Button } from '@/components/ui/button';

interface AmountPresetsProps {
  presets: number[];
  currency: string;
  onSelect: (amount: number) => void;
  selectedAmount?: string;
}

const AmountPresets: React.FC<AmountPresetsProps> = ({
  presets,
  currency,
  onSelect,
  selectedAmount
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((amount) => (
        <Button
          key={amount}
          type="button"
          variant={selectedAmount === String(amount) ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(amount)}
          className="text-xs transition-all duration-200 hover:scale-105"
        >
          {amount.toLocaleString()} {currency}
        </Button>
      ))}
    </div>
  );
};

export default AmountPresets;
