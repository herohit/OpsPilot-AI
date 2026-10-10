import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, FileText, Layers, LockKeyhole, Mail, Rocket, Sparkles, TrendingUp } from 'lucide-react'
import LoginImg from '../assets/login.png'
import OpsPilotLogo from '../components/OpsPilotLogo'
import SocialAuthButtons from '../components/SocialAuthButtons'
import TrustedTeams from '../components/TrustedTeams'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router'
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchema";
import api from "../api/client";
import { useAuthStore } from "../store/authStore";
import { getCurrentUser } from "../api/AuthApi";


const Login = () => {
    
  const login = useAuthStore((state) => state.login);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const logout = useAuthStore((state) => state.logout);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });


  const [showPassword, setShowPassword] = useState(false);

  const features = [
    { label: 'Manage your infrastructure', Icon: Layers },
    { label: 'Monitor services in real-time', Icon: TrendingUp },
    { label: 'View logs and metrics', Icon: FileText },
    { label: 'Deploy with confidence', Icon: Rocket },
  ];

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username",data.email);
      formData.append("password",data.password);

      const response = await api.post('/login',formData,{
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = response.data.access_token;
      setAccessToken(accessToken);
      // The Axios interceptor attaches the stored token.
      const userResponse = await getCurrentUser();
      login(userResponse, accessToken);

      navigate("/dashboard", { replace: true });
      toast.success('Login successful');
    } catch (error) {
      logout();
      console.error(error);
      toast.error('Login failed');
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'rohit@gmail.com', { shouldValidate: true });
    setValue('password', 'test123', { shouldValidate: true });
  };

  return (
  <div className="login-container min-h-screen md:flex">
    <section className="relative min-h-[720px] overflow-hidden bg-[#030817] text-white md:min-h-screen md:flex-1">
      <img className="absolute inset-0 h-full w-full object-cover object-center brightness-75 saturate-125" src={LoginImg} alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030817]/70 via-transparent to-[#030817]/35" />
      <div className="relative z-10 flex min-h-[720px] flex-col px-6 py-8 sm:px-10 md:min-h-screen md:px-12 md:py-10">
        <OpsPilotLogo />

        <div className="mt-7 max-w-md">
          <h1 className="text-[27px] font-semibold leading-tight tracking-tight sm:text-3xl">
            Deploy. Monitor. Scale.
            <span className="mt-1 block text-white/90">All in one place.</span>
          </h1>
          <ul className="mt-6 space-y-2.5">
            {features.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-3 text-[13px] text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/40 bg-blue-500/20 text-blue-100">
                  <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <TrustedTeams />
      </div>
    </section>

    <section className="flex min-h-[680px] items-center justify-center bg-white px-6 py-12 text-slate-900 md:min-h-screen md:flex-1 md:px-10">
      <div className="w-full max-w-[360px]">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your OpsPilot account</p>
        </header>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-800">Email</label>
            <div className="relative mt-1.5">
              <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input {...register("email")} type="email" id="email" name="email" placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.email ? 'border-red-500' : 'border-slate-200'}`} />
            </div>
            {errors.email && <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-800">Password</label>
            <div className="relative mt-1.5">
              <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input {...register("password")}
                type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="Enter your password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className={`h-11 w-full rounded-lg border bg-white pl-10 pr-11 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.password ? 'border-red-500' : 'border-slate-200'}`} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800">
                {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</a>
          </div>

          <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Use demo credentials
          </button>
        </form>

        <SocialAuthButtons />

        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account? <a href="#" className="font-medium text-blue-600 hover:text-blue-700">Sign up</a>
        </p>
      </div>
    </section>
    
    </div>
  )
}

export default Login;