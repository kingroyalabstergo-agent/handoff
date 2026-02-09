"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input defaultValue="My Agency" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input defaultValue="my-agency" />
          </div>
          <div>
            <Label>Brand Color</Label>
            <Input defaultValue="#6366f1" type="color" className="w-20 h-10" />
          </div>
          <Separator />
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
