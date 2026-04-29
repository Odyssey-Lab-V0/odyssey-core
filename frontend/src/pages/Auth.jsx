import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";

const AuthShell = ({ title, subtitle, children, footer }) => (
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
        <div className="w-full max-w-md">
          <div className="overline mb-3">{subtitle}</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight font-medium leading-[1.05]">
            {title}
          </h1>
          <div className="mt-10">{children}</div>
          {footer && (
            <div className="mt-8 text-sm text-[#6B6A65]">{footer}</div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-[#9D9C96] font-mono-data">
        © 2026 Kindred Wealth · Demo
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

const Field = ({ label, ...props }) => (
  <label className="block">
    <div className="overline mb-2">{label}</div>
    <input
      {...props}
      className="w-full h-11 rounded-lg border border-[#E6E5E1] bg-white px-3.5 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15 transition"
    />
  </label>
);

export const Login = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      login({ email: email.trim().toLowerCase(), password });
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
        <Field
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com"
          data-testid="login-email-input"
        />
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
              className="w-full h-11 rounded-lg border border-[#E6E5E1] bg-white px-3.5 pr-10 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#6B6A65] hover:text-[#1C1C19]"
              aria-label="Toggle password visibility"
            >
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
          Sign in
          <ArrowRight size={16} weight="bold" className="transition group-hover:translate-x-0.5" />
        </button>

        <div className="text-xs text-[#9D9C96] font-mono-data text-center">
          demo: create any account — data is stored locally
        </div>
      </form>
    </AuthShell>
  );
};

export const Signup = () => {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be 6+ characters.");
    setLoading(true);
    try {
      signup({ name: name.trim(), email: email.trim().toLowerCase(), password });
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
      subtitle="Create account"
      title="Begin with intention."
      footer={
        <span>
          Already with us?{" "}
          <Link to="/login" className="text-[#1A362D] underline underline-offset-4 hover:text-[#2C4F44]" data-testid="goto-login-link">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-5" data-testid="signup-form">
        <Field
          label="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Eleanor Hayes"
          data-testid="signup-name-input"
        />
        <Field
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com"
          data-testid="signup-email-input"
        />
        <Field
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          data-testid="signup-password-input"
        />
        <button
          type="submit"
          disabled={loading}
          data-testid="signup-submit-button"
          className="w-full h-11 rounded-lg bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          Create account
          <ArrowRight size={16} weight="bold" />
        </button>
      </form>
    </AuthShell>
  );
};
