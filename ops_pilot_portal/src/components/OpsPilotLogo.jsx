export default function OpsPilotLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600">
        <span className="absolute h-1 w-11 rotate-[-45deg] bg-[#06112c]" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      <span className="text-xl font-semibold tracking-tight">OpsPilot</span>
    </div>
  );
}