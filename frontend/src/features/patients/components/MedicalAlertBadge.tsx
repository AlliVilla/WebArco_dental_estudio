import type { MedicalAlertBadge as MedicalAlertBadgeType, MedicalAlertTone } from "../utils/patientMedicalAlerts";

const BADGE_STYLES: Record<
  MedicalAlertTone,
  { background: string; border: string; dot: string; color: string }
> = {
  warning: {
    background: "#FFFBEB",
    border: "#FDE68A",
    dot: "#EF9F27",
    color: "#B45309",
  },
  danger: {
    background: "#FEF2F2",
    border: "#FECACA",
    dot: "#E24B4A",
    color: "#E24B4A",
  },
  anesthesia: {
    background: "#FFF7ED",
    border: "#FED7AA",
    dot: "#F97316",
    color: "#C2410C",
  },
};

export interface MedicalAlertBadgeProps {
  badge: MedicalAlertBadgeType;
}

export function MedicalAlertBadge({ badge }: MedicalAlertBadgeProps) {
  const styles = BADGE_STYLES[badge.tone];

  return (
    <span
      style={{
        alignItems: "center",
        background: styles.background,
        border: `1px solid ${styles.border}`,
        borderRadius: 999,
        color: styles.color,
        display: "inline-flex",
        fontSize: 12,
        fontWeight: 500,
        gap: 5,
        lineHeight: "18px",
        padding: "5px 12px",
      }}
    >
      <span
        style={{
          background: styles.dot,
          borderRadius: 3,
          flexShrink: 0,
          height: 6,
          width: 6,
        }}
      />
      {badge.label}
    </span>
  );
}
