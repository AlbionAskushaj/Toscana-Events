import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="d-flex flex-wrap gap-2">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep;
        const isComplete = idx < currentStep;
        const badgeClass = isActive ? "bg-primary" : isComplete ? "bg-success text-dark" : "bg-light text-dark";
        return (
          <span key={label} className={`badge d-flex align-items-center gap-2 py-2 px-3 ${badgeClass}`}>
            <span className="fw-semibold">{idx + 1}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
};

export default Stepper;
