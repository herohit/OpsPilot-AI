import GoogleBWIcon from "../assets/google-white-icon.svg";
import AwsBWIcon from "../assets/aws-logo.png";

export default function TrustedTeams() {
  return (
    <div className="mt-auto rounded-xl border border-white/10 bg-[#07122b]/75 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] text-slate-300">Trusted by modern teams</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs font-semibold leading-5 sm:text-sm">
        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none text-white">
            {"\u25B2"}
          </span>
          <span className="block shrink-0 text-white">Vercel</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
          <img src={AwsBWIcon} alt="" className="h-6 w-6 shrink-0 object-contain" />
          <span className="block shrink-0 text-white">AWS</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
          <img src={GoogleBWIcon} alt="" className="h-6 w-6 shrink-0 object-contain" />
          <span className="block shrink-0 text-white">Google Cloud</span>
        </span>
      </div>
    </div>
  );
}