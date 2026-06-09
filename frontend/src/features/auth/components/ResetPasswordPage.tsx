import { useSearchParams } from "react-router-dom";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import heroBg from "../../../assets/hero.png";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <ForgotPasswordForm initialToken={token} />
      </div>
    </div>
  );
}

export default ResetPasswordPage;
