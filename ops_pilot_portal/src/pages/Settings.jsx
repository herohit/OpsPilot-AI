import { useState } from "react";
import {
  Bell,
  Building2,
  KeyRound,
  Plug,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateCurrentUser } from "../api/AuthApi";
import { useAuthStore } from "../store/authStore";

const settingsTabs = [
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "organization", label: "Organization", Icon: Building2 },
  { id: "integrations", label: "Integrations", Icon: Plug },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "api-keys", label: "API Keys", Icon: KeyRound },
];

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(
    [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  );
  const [isSaving, setIsSaving] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const nameParts = name.trim().split(/\s+/);
    if (!nameParts[0]) {
      toast.error("Enter your name.");
      return;
    }
    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUser({
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" "),
      });
      setUser(updatedUser);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeSettingsTab = settingsTabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = activeSettingsTab.Icon;

  return (
    <section className="space-y-4 pb-8" aria-label="Settings">
      <nav role="tablist" aria-label="Settings sections" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {settingsTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`h-10 shrink-0 border-b-2 px-4 text-xs font-semibold transition-colors ${activeTab === id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "profile" ? (
        <form onSubmit={handleSaveProfile} className="max-w-4xl">
          <div className="grid gap-4 border-b border-slate-100 py-5 md:grid-cols-[minmax(8rem,0.8fr)_minmax(10rem,1fr)_minmax(11rem,0.8fr)]">
            <label className="block text-xs font-semibold text-slate-700">
              Name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Email
              <input
                type="email"
                readOnly
                value={user?.email ?? ""}
                className="mt-2 h-10 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500"
              />
            </label>
            <div>
              <p className="text-xs font-semibold text-slate-700">Avatar</p>
              <div className="mt-2 flex h-10 items-center gap-3">
                <span role="img" aria-label={`${name || "User"} avatar`} className="grid h-9 w-9 place-items-center rounded-full bg-[#334786] text-xs font-semibold text-white">
                  {initials || <UserRound aria-hidden="true" className="h-4 w-4" />}
                </span>
                <span className="text-xs text-slate-500">Initials from your profile name</span>
              </div>
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      ) : (
        <div className="flex min-h-64 max-w-3xl flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-6 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-700">
            {activeTab === "api-keys" ? <ShieldCheck aria-hidden="true" className="h-5 w-5" /> : <ActiveIcon aria-hidden="true" className="h-5 w-5" />}
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">{activeSettingsTab.label}</h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {activeTab === "api-keys"
              ? "API key management is not available yet."
              : `${activeSettingsTab.label} settings are not configured yet.`}
          </p>
        </div>
      )}
    </section>
  );
}