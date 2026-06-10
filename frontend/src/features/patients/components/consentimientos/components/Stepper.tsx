import { CheckCircle2 } from "lucide-react";
import type { ConsentStep } from "./types";
import { stepLabel } from "./consentUtils";

interface StepperProps {
  currentStep: ConsentStep;
}

export function Stepper({ currentStep }: StepperProps) {
  const steps: ConsentStep[] = [1, 2, 3, 4];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        alignItems: "center",
      }}
    >
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
                background: isActive || isDone ? "var(--arco-primary)" : "var(--arco-gray-100)",
                color: isActive || isDone ? "var(--primary-foreground)" : "var(--arco-gray-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {isDone ? <CheckCircle2 size={13} /> : step}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                whiteSpace: "nowrap",
              }}
            >
              {stepLabel(step)}
            </span>
            {step < 4 && <div style={{ height: 1, background: "var(--border)", flex: 1 }} />}
          </div>
        );
      })}
    </div>
  );
}
