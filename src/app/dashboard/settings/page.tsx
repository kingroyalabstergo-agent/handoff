"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setOrgName(data.org_name || "");
        setOrgSlug(data.org_slug || "");
        setBrandColor(data.brand_color || "#6366f1");
        setFullName(data.full_name || "");
      }
      setLoading(false);
    });
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      org_name: orgName, org_slug: orgSlug, brand_color: brandColor, full_name: fullName,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-3">Manage your account and organization</p>
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={user?.email || ""} disabled className="opacity-50" /></div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
          <div><Label>Slug</Label><Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="my-agency" /></div>
          <div><Label>Brand Color</Label><Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} type="color" className="w-20 h-10" /></div>
          <Separator />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

