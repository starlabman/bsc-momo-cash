import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface FormStepIndicatorProps {
  steps: Step[];
}

const FormStepIndicator: React.FC<FormStepIndicatorProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-between w-full mb-4 sm:mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <div
              className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300",
                step.completed
                  ? "bg-primary text-primary-foreground"
                  : step.active
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                step.active || step.completed ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2 transition-colors duration-300",
                steps[index + 1].completed || steps[index + 1].active
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default FormStepIndicator;
