import Github from "../assets/github.svg";
import GoogleIcon from "../assets/google-icon.svg";

export default function SocialAuthButtons({ variant = "login", onGithub, onGoogle }) {
  const dividerClassName = variant === "signup"
    ? "text-[10px] font-medium"
    : "text-[11px] font-semibold tracking-wide";
  const buttonClassName = variant === "signup"
    ? "rounded-md bg-transparent"
    : "rounded-lg bg-white";

  return (
    <>
      <div className={`my-6 flex items-center gap-3 uppercase text-slate-400 ${dividerClassName}`}>
        <span className="h-px flex-1 bg-slate-200" />
        Or continue with
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onGithub}
          className={`flex h-11 items-center justify-center gap-2 border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer ${buttonClassName}`}
        >
          <img src={Github} alt="" className="h-5 w-5" />
          GitHub
        </button>
        <button
          type="button"
          onClick={onGoogle}
          className={`flex h-11 items-center justify-center gap-2 border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 cursor-pointer ${buttonClassName}`}
        >
          <img src={GoogleIcon} alt="" className="h-5 w-5" />
          Google
        </button>
      </div>
    </>
  );
}