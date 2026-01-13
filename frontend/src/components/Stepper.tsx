import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="d-flex flex-wrap gap-2">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isComplete = idx < currentStep;
        const badgeClass = isActive ? "bg-primary" : isComplete ? "bg-success text-dark" : "bg-light text-dark";
        return (
          <button
            key={label}
            type="button"
            className={`badge d-flex align-items-center gap-2 py-2 px-3 ${badgeClass}`}
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
