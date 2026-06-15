import { FullWidthField } from "../../../components";

export function SectionDescription({ children }: { children: string }) {
  return (
    <FullWidthField>
      <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: 0 }}>
        {children}
      </p>
    </FullWidthField>
  );
}
