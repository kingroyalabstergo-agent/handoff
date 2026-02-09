"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  User,
  Building2,
  Palette,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";

const TOTAL_STEPS = 4;

const BRAND_COLORS = [
  "#E8A040",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EF4444",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#37322F",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Step 1 — Account type
  const [accountType, setAccountType] = useState<"freelancer" | "agency" | null>(null);

  // Step 2 — Workspace
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");

  // Step 3 — Profile
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");

  // Step 4 — Brand
  const [brandColor, setBrandColor] = useState("#E8A040");

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      // Pre-fill from auth metadata
      const meta = user.user_metadata;
      if (meta?.full_name) setFullName(meta.full_name);

      // Check if already onboarded
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_name, onboarded")
        .eq("id", user.id)
        .single();

      if (profile?.onboarded) {
        router.push("/dashboard");
        return;
      }

      setInitialLoading(false);
    }
    loadUser();
  }, []);

  function handleOrgNameChange(value: string) {
    setOrgName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    );
  }

  async function handleFinish() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        org_name: orgName || (accountType === "freelancer" ? fullName : ""),
        slug: slug || fullName.toLowerCase().replace(/\s+/g, "-"),
        brand_color: brandColor,
        account_type: accountType,
        role: role,
        onboarded: true,
      })
      .eq("id", user.id);

    router.push("/dashboard");
  }

  const canNext = () => {
    switch (step) {
      case 1: return accountType !== null;
      case 2: return orgName.trim().length > 0;
      case 3: return fullName.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5F3] dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#E8A040]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] dark:bg-zinc-950 flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[rgba(55,50,47,0.06)] dark:bg-zinc-900">
        <div
          className="h-full bg-[#E8A040] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center pt-8 pb-2">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  i + 1 < step
                    ? "bg-[#E8A040] text-white"
                    : i + 1 === step
                    ? "bg-[#E8A040] text-white shadow-lg shadow-[#E8A040]/25"
                    : "bg-[rgba(55,50,47,0.06)] dark:bg-zinc-800 text-[rgba(55,50,47,0.3)] dark:text-zinc-600"
                }`}
              >
                {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={`w-8 h-px transition-colors duration-300 ${
                    i + 1 < step
                      ? "bg-[#E8A040]"
                      : "bg-[rgba(55,50,47,0.1)] dark:bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step 1 — Account type */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1
                  className="text-4xl font-normal text-[#37322F] dark:text-white tracking-tight"
                  style={{ fontFamily: "var(--font-instrument-serif)" }}
                >
                  How do you work?
                </h1>
                <p className="text-[rgba(55,50,47,0.6)] dark:text-zinc-500 text-sm">
                  This helps us tailor your experience.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAccountType("freelancer")}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    accountType === "freelancer"
                      ? "border-[#E8A040] bg-white dark:bg-zinc-900 shadow-lg shadow-[#E8A040]/10"
                      : "border-[rgba(55,50,47,0.08)] dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-[rgba(55,50,47,0.15)] dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      accountType === "freelancer"
                        ? "bg-[#E8A040]/15 text-[#E8A040]"
                        : "bg-[rgba(55,50,47,0.04)] dark:bg-zinc-800 text-[rgba(55,50,47,0.4)] dark:text-zinc-500"
                    }`}
                  >
                    <User className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-[#37322F] dark:text-white mb-1">
                    Freelancer
                  </h3>
                  <p className="text-xs text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
                    I work independently with my own clients
                  </p>
                  {accountType === "freelancer" && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-[#E8A040] flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setAccountType("agency")}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                    accountType === "agency"
                      ? "border-[#E8A040] bg-white dark:bg-zinc-900 shadow-lg shadow-[#E8A040]/10"
                      : "border-[rgba(55,50,47,0.08)] dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-[rgba(55,50,47,0.15)] dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      accountType === "agency"
                        ? "bg-[#E8A040]/15 text-[#E8A040]"
                        : "bg-[rgba(55,50,47,0.04)] dark:bg-zinc-800 text-[rgba(55,50,47,0.4)] dark:text-zinc-500"
                    }`}
                  >
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-[#37322F] dark:text-white mb-1">
                    Agency
                  </h3>
                  <p className="text-xs text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
                    I manage a team and multiple clients
                  </p>
                  {accountType === "agency" && (
                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-[#E8A040] flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Workspace */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1
                  className="text-4xl font-normal text-[#37322F] dark:text-white tracking-tight"
                  style={{ fontFamily: "var(--font-instrument-serif)" }}
                >
                  Name your workspace
                </h1>
                <p className="text-[rgba(55,50,47,0.6)] dark:text-zinc-500 text-sm">
                  {accountType === "agency"
                    ? "Your agency name — clients will see this."
                    : "Your business name — clients will see this."}
                </p>
              </div>

              <div className="space-y-5 max-w-sm mx-auto">
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">
                    {accountType === "agency" ? "Agency Name" : "Business Name"}
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    placeholder={
                      accountType === "agency"
                        ? "Acme Creative Studio"
                        : "Jane Smith Design"
                    }
                    className="h-12 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50 text-base"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">
                    Portal URL
                  </Label>
                  <div className="flex items-center h-12 rounded-xl border border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                    <span className="px-3 text-sm text-[rgba(55,50,47,0.4)] dark:text-zinc-600 bg-[#F7F5F3] dark:bg-zinc-900 h-full flex items-center border-r border-[rgba(55,50,47,0.1)] dark:border-zinc-800">
                      handoff.app/
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 px-3 h-full bg-transparent text-[#37322F] dark:text-white text-sm outline-none placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600"
                      placeholder="your-workspace"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Profile */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1
                  className="text-4xl font-normal text-[#37322F] dark:text-white tracking-tight"
                  style={{ fontFamily: "var(--font-instrument-serif)" }}
                >
                  About you
                </h1>
                <p className="text-[rgba(55,50,47,0.6)] dark:text-zinc-500 text-sm">
                  Tell us a bit about yourself.
                </p>
              </div>

              <div className="space-y-5 max-w-sm mx-auto">
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">
                    Full Name
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="h-12 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50 text-base"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">
                    Your Role
                  </Label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder={
                      accountType === "agency"
                        ? "Creative Director"
                        : "Web Designer"
                    }
                    className="h-12 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50 text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Brand */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <h1
                  className="text-4xl font-normal text-[#37322F] dark:text-white tracking-tight"
                  style={{ fontFamily: "var(--font-instrument-serif)" }}
                >
                  Pick your brand color
                </h1>
                <p className="text-[rgba(55,50,47,0.6)] dark:text-zinc-500 text-sm">
                  This will be used in your client portal.
                </p>
              </div>

              <div className="max-w-sm mx-auto space-y-6">
                {/* Color grid */}
                <div className="flex flex-wrap justify-center gap-3">
                  {BRAND_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrandColor(color)}
                      className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                        brandColor === color
                          ? "ring-2 ring-offset-2 ring-offset-[#F7F5F3] dark:ring-offset-zinc-950 ring-[#37322F] dark:ring-white scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Custom color */}
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-600">
                    Or custom:
                  </span>
                  <div className="flex items-center gap-2 rounded-lg border border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-3 py-1.5">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-6 w-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-[#37322F] dark:text-zinc-400 font-mono">
                      {brandColor}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-2xl border border-[rgba(55,50,47,0.08)] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3">
                  <div className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-600 uppercase tracking-wider">
                    Portal preview
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-[#37322F] dark:text-white">
                      {orgName || "Your Workspace"}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full w-2/3"
                    style={{ backgroundColor: brandColor, opacity: 0.3 }}
                  />
                  <div
                    className="h-2 rounded-full w-1/2"
                    style={{ backgroundColor: brandColor, opacity: 0.15 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 max-w-sm mx-auto">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 hover:text-[#37322F] dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="h-11 px-6 rounded-xl bg-[#37322F] hover:bg-[#4A443F] dark:bg-[#E8A040] dark:hover:bg-[#D4922E] text-white font-medium disabled:opacity-40"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="h-11 px-8 rounded-xl bg-[#E8A040] hover:bg-[#D4922E] text-white font-medium"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Launch Handoff
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
