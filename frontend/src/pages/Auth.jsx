import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";

const AuthShell = ({ title, subtitle, children, footer, wide = false }) => (
  <div className="min-h-screen flex bg-[#F9F9F8]">
    <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-20 py-10">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[#1A362D] text-[#F9F9F8] font-heading">
          K
        </div>
        <div className="leading-tight">
          <div className="font-heading text-base">Kindred</div>
          <div className="overline" style={{ fontSize: 9 }}>
            Wealth Studio
          </div>
        </div>
      </div>

      <div className="flex-1 grid place-items-center">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          <div className="overline mb-3">{subtitle}</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight font-medium leading-[1.05]">
            {title}
          </h1>
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-8 text-sm text-[#6B6A65]">{footer}</div>}
        </div>
      </div>

      <div className="text-[11px] text-[#9D9C96] font-mono-data">
        © 2026 Kindred Wealth · Micronaut backend
      </div>
    </div>

    <div className="hidden lg:block flex-1 relative overflow-hidden">
      <img
        alt=""
        src="https://images.unsplash.com/photo-1759485683311-0bcfa34eb6b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNhbmQlMjB0ZXh0dXJlfGVufDB8fHx8MTc3NzQ3NTU3Mnww&ixlib=rb-4.1.0&q=85"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute bottom-10 left-10 right-10 text-[#F9F9F8]">
        <div className="overline" style={{ color: "#E2D8CE" }}>Quiet capital</div>
        <p className="font-heading text-2xl mt-2 max-w-md leading-snug">
          A calm command center for your assets, holdings, and long-horizon goals.
        </p>
      </div>
    </div>
    <Toaster position="bottom-right" />
  </div>
);

const inputCls =
  "w-full h-11 rounded-lg border border-[#E6E5E1] bg-white px-3.5 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15 transition";

const Field = ({ label, ...props }) => (
  <label className="block">
    <div className="overline mb-2">{label}</div>
    <input {...props} className={inputCls} />
  </label>
);

export const Login = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      toast.success("Welcome back.");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      subtitle="Sign in"
      title="Welcome back."
      footer={
        <span>
          New here?{" "}
          <Link to="/signup" className="text-[#1A362D] underline underline-offset-4 hover:text-[#2C4F44]" data-testid="goto-signup-link">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-5" data-testid="login-form">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" data-testid="login-email-input" />
        <label className="block">
          <div className="overline mb-2">Password</div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              data-testid="login-password-input"
              className={inputCls + " pr-10"}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#6B6A65] hover:text-[#1C1C19]" aria-label="Toggle password visibility">
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit-button"
          className="group w-full h-11 rounded-lg bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight size={16} weight="bold" className="transition group-hover:translate-x-0.5" />
        </button>

        <div className="text-xs text-[#9D9C96] font-mono-data text-center">
          admin demo: admin@kindred.local / Admin@12345
        </div>
      </form>
    </AuthShell>
  );
};

const COUNTRIES = ["US", "UK", "CA", "AU", "DE", "FR", "IN", "SG", "JP", "AE", "BR", "MX", "Other"];

export const Signup = () => {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    country: "US",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (!form.fullName.trim()) return toast.error("Please enter your full name.");
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || null,
        country: form.country || null,
        dateOfBirth: form.dateOfBirth || null,
      });
      toast.success("Account created.");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      subtitle={step === 1 ? "Create account · Step 1 of 2" : "Onboarding · Step 2 of 2"}
      title={step === 1 ? "Begin with intention." : "A few last details."}
      footer={
        <span>
          Already with us?{" "}
          <Link to="/login" className="text-[#1A362D] underline underline-offset-4 hover:text-[#2C4F44]" data-testid="goto-login-link">
            Sign in
          </Link>
        </span>
      }
    >
      {step === 1 ? (
        <form onSubmit={next} className="space-y-5" data-testid="signup-form">
          <Field label="Full name" required value={form.fullName} onChange={(e) => upd("fullName", e.target.value)} placeholder="Eleanor Hayes" data-testid="signup-name-input" />
          <Field label="Email" type="email" required value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@firm.com" data-testid="signup-email-input" />
          <Field label="Password" type="password" required value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder="At least 8 characters" data-testid="signup-password-input" />
          <button
            type="submit"
            data-testid="signup-next-button"
            className="w-full h-11 rounded-lg bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={16} weight="bold" />
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-5" data-testid="onboarding-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" type="tel" value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+1 555 0100" data-testid="onboarding-phone-input" />
            <label className="block">
              <div className="overline mb-2">Country</div>
              <select
                className={inputCls}
                value={form.country}
                onChange={(e) => upd("country", e.target.value)}
                data-testid="onboarding-country-select"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <Field
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => upd("dateOfBirth", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            data-testid="onboarding-dob-input"
          />
          <div className="text-xs text-[#9D9C96] font-mono-data">
            All onboarding fields are stored on the Micronaut backend with bcrypt-hashed credentials.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 px-4 rounded-lg border border-[#E6E5E1] bg-white text-sm hover:bg-[#F3F3F1]"
              data-testid="onboarding-back-button"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="signup-submit-button"
              className="flex-1 h-11 rounded-lg bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
};
