import { useState } from "react";
import {
  ArrowRight,
  Circle,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import SigninImg from "../assets/opspilot-create-account.png";
import GoogleBWIcon from "../assets/google-white-icon.svg";
import AwsBWIcon from "../assets/aws-logo.png";
import Github from "../assets/github.svg";
import GoogleIcon from "../assets/google-icon.svg";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupPasswordRules, signupSchema } from "../schemas/authSchema";
import api from "../api/client";

const Signup = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const password = useWatch({ control, name: "password" });

  const passwordChecklist = signupPasswordRules.map((rule) => {
    const satisfied = rule.test(password);
    const Icon = satisfied ? CircleCheck : Circle;

    return (
      <li
        key={rule.label}
        className="flex items-center gap-2 text-xs leading-4 text-slate-500"
      >
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 ${satisfied ? "fill-emerald-400 text-white" : "text-slate-300"}`}
        />
        <span>
          {rule.label}
          <span className="sr-only">{satisfied ? ": met" : ": not met"}</span>
        </span>
      </li>
    );
  });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const [firstName, ...lastName] = data.fullName.split(/\s+/);
      await api.post("/register", {
        email: data.email,
        password: data.password,
        first_name: firstName,
        last_name: lastName.join(" "),
      });

      toast.success("Account created. Sign in to continue.");
      navigate("/login", { replace: true });
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === "string"
          ? detail
          : "Unable to create your account. Please try again.",
      );
    }
  };

  return (
    <div className="login-container min-h-screen md:flex">
      <section className="relative min-h-[720px] overflow-hidden bg-[#030817] text-white md:min-h-screen md:flex-1">
        <img
          className="absolute inset-0 h-full w-full translate-y-[15vh] object-cover object-cover brightness-95 saturate-125"
          src={SigninImg}
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030817]/70 via-transparent to-[#030817]/35" />
        <div className="relative z-10 flex min-h-[720px] flex-col px-6 py-8 sm:px-10 md:min-h-screen md:px-12 md:py-10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600">
              <span className="absolute h-1 w-11 rotate-[-45deg] bg-[#06112c]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-xl font-semibold tracking-tight">
              OpsPilot
            </span>
          </div>

          <div className="mt-10 max-w-md sm:mt-12">
            <h1 className="text-[28px] font-semibold leading-[1.2] tracking-normal text-white sm:text-3xl lg:text-4xl">
              Start building
              <span className="mt-1.5 block text-blue-200">
                your infrastructure
              </span>
            </h1>
            <p className="mt-4 max-w-[34ch] text-sm leading-6 text-slate-300 sm:text-[15px] sm:leading-7">
              Create an account and get started with modern infrastructure
              management.
            </p>
          </div>

          <div className="mt-auto rounded-xl border border-white/10 bg-[#07122b]/75 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] text-slate-300">
              Trusted by modern teams
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs font-semibold leading-5 sm:text-sm">
              <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none text-white"
                >
                  ▲
                </span>
                <span className="block shrink-0 text-white">Vercel</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                <img
                  src={AwsBWIcon}
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <span className="block shrink-0 text-white">AWS</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                <img
                  src={GoogleBWIcon}
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <span className="block shrink-0 text-white">Google Cloud</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[680px] items-center justify-center bg-[#fcfdff] px-6 py-12 tracking-normal text-slate-900 md:min-h-screen md:flex-1 md:px-10">
        <div className="w-full max-w-[360px]">
          <header className="mb-6">
            <h2 className="text-2xl font-bold leading-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details to get started
            </p>
          </header>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="fullName"
                className="block text-[13px] font-medium text-slate-800"
              >
                Full name
              </label>
              <div className="relative mt-1.5">
                <UserRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  {...register("fullName")}
                  type="text"
                  id="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? "full-name-error" : undefined
                  }
                  className={`h-11 w-full rounded-md border bg-transparent pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.fullName ? "border-red-500" : "border-slate-200"}`}
                />
              </div>
              {errors.fullName && (
                <p
                  id="full-name-error"
                  role="alert"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-slate-800"
              >
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`h-11 w-full rounded-md border bg-transparent pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.email ? "border-red-500" : "border-slate-200"}`}
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-slate-800"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <LockKeyhole
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? "password-requirements password-error"
                      : "password-requirements"
                  }
                  className={`h-11 w-full rounded-md border bg-transparent pl-10 pr-11 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.password ? "border-red-500" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
              </div>
              <ul id="password-requirements" className="mt-3 space-y-1.5 pl-3">
                {passwordChecklist}
              </ul>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0866ff] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Or continue with
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                toast.error("GitHub sign-up is not available yet.")
              }
              className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-transparent text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer"
            >
              <img src={Github} alt="" className="h-5 w-5" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() =>
                toast.error("Google sign-up is not available yet.")
              }
              className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-transparent text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer"
            >
              <img src={GoogleIcon} alt="" className="h-5 w-5" /> Google
            </button>
          </div>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Signup;
