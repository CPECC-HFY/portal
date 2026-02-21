export const runtime = "edge";
("use client");

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Bell, Shield, Globe, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and account settings.
        </p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="size-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Shield className="size-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select a theme for the portal interface.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                        theme === t.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <t.icon
                        className={cn(
                          "size-6",
                          theme === t.value ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          theme === t.value ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for a denser layout.
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Announcements</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new announcements are published.
                  </p>
                </div>
                <Switch checked={notifyAnnouncements} onCheckedChange={setNotifyAnnouncements} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you.
                  </p>
                </div>
                <Switch checked={notifyMentions} onCheckedChange={setNotifyMentions} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive system maintenance and security alerts.
                  </p>
                </div>
                <Switch checked={notifySystem} onCheckedChange={setNotifySystem} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of notifications via email.
                  </p>
                </div>
                <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account security and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button>Update Password</Button>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">Language & Region</Label>
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm">English (United States)</span>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <h4 className="font-semibold text-destructive">Danger Zone</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once you delete your account, there is no going back.
                </p>
                <Button variant="destructive" size="sm" className="mt-3">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
