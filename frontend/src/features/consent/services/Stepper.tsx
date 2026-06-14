import { CheckCircle2 } from "lucide-react";
import type { ConsentStep } from "../types";
import { stepLabel } from "./consentUtils";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface StepperProps {
  currentStep: ConsentStep;
}

export function Stepper({ currentStep }: StepperProps) {
  const { isMobile } = useResponsive();
  const steps: ConsentStep[] = [1, 2, 3, 4];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 4 : 8,
        overflowX: "auto",
      }}
    >
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 4 : 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
                background:
                  isActive || isDone
                    ? "var(--arco-primary)"
                    : "var(--arco-gray-100)",
                color:
                  isActive || isDone
                    ? "var(--primary-foreground)"
                    : "var(--arco-gray-500)",
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
            {!isMobile && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                {stepLabel(step)}
              </span>
            )}
            {step < 4 && (
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  width: isMobile ? 16 : 32,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
      {/* En móvil mostramos el label del step actual debajo */}
      {isMobile && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--foreground)",
            marginLeft: 8,
            whiteSpace: "nowrap",
          }}
        >
          {stepLabel(currentStep)}
        </span>
      )}
    </div>
  );
}
