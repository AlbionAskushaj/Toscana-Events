import React, { useEffect, useState } from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentStep <= 0) return;
    setPulseIndex(currentStep - 1);
    const timer = window.setTimeout(() => setPulseIndex(null), 700);
    return () => window.clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="d-flex flex-wrap gap-2">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isComplete = idx < currentStep;
        const badgeClass = isActive ? "bg-primary" : isComplete ? "bg-success text-dark" : "bg-light text-dark";
        const pulseClass = pulseIndex === idx ? "stepper-pulse" : "";
        return (
          <button
            key={label}
            type="button"
            className={`badge d-flex align-items-center gap-2 py-2 px-3 ${badgeClass} ${pulseClass}`}
            onClick={() => (isComplete && onStepClick ? onStepClick(idx) : undefined)}
            aria-current={isActive ? "step" : undefined}
            disabled={!isComplete || !onStepClick}
          >
            <span className="fw-semibold">{idx + 1}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Stepper;
