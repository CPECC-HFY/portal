"use client";
export const runtime = "edge";
import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  const t = useTranslations("Settings");
  const commonT = useTranslations("Common");
  const authT = useTranslations("Auth");

  useEffect(() => {
    const loadPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.preferences) {
        const prefs = user.user_metadata.preferences;
        if (prefs.notifyAnnouncements !== undefined) setNotifyAnnouncements(prefs.notifyAnnouncements);
        if (prefs.notifyMentions !== undefined) setNotifyMentions(prefs.notifyMentions);
        if (prefs.notifySystem !== undefined) setNotifySystem(prefs.notifySystem);
        if (prefs.emailDigest !== undefined) setEmailDigest(prefs.emailDigest);
      }
    };
    loadPrefs();
  }, []);

  const savePreferences = async (newPrefs: any) => {
    try {
      setIsUpdatingPrefs(true);
      const { data: { user } } = await supabase.auth.getUser();
      const currentPrefs = user?.user_metadata?.preferences || {};
      const updatedPrefs = { ...currentPrefs, ...newPrefs };

      const { error } = await supabase.auth.updateUser({
        data: { preferences: updatedPrefs }
      });

      if (error) throw error;
      toast.success(t("prefUpdated"));
    } catch (error: any) {
      toast.error(t("prefFailed"));
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleToggle = (setter: any, key: string) => (checked: boolean) => {
    setter(checked);
    savePreferences({ [key]: checked });
  };


  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      toast.error(t("fillPasswords"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordLength"));
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success(t("passwordUpdated"));
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || t("passwordFailed"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const themes = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("systemTheme"), icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subHeader")}
        </p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="size-4" />
            {t("appearance")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" />
            {commonT("notifications")}
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Shield className="size-4" />
            {t("accountSettings")}
          </TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("appearance")}</CardTitle>
              <CardDescription>{t("appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">{t("theme")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("themeDesc")}
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

            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationPrefs")}</CardTitle>
              <CardDescription>{t("notificationPrefsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{commonT("announcements")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("announcementsDesc")}
                  </p>
                </div>
                <Switch
                  disabled={isUpdatingPrefs}
                  checked={notifyAnnouncements}
                  onCheckedChange={handleToggle(setNotifyAnnouncements, 'notifyAnnouncements')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{t("mentions")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("mentionsDesc")}
                  </p>
                </div>
                <Switch
                  disabled={isUpdatingPrefs}
                  checked={notifyMentions}
                  onCheckedChange={handleToggle(setNotifyMentions, 'notifyMentions')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{t("systemAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("systemAlertsDesc")}
                  </p>
                </div>
                <Switch
                  disabled={isUpdatingPrefs}
                  checked={notifySystem}
                  onCheckedChange={handleToggle(setNotifySystem, 'notifySystem')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{t("emailDigest")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("emailDigestDesc")}
                  </p>
                </div>
                <Switch
                  disabled={isUpdatingPrefs}
                  checked={emailDigest}
                  onCheckedChange={handleToggle(setEmailDigest, 'emailDigest')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("accountSettings")}</CardTitle>
              <CardDescription>{t("accountSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>{t("newPassword")}</Label>
                  <Input
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("confirmPassword")}</Label>
                  <Input
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || !password || !confirmPassword}
                >
                  {isUpdatingPassword ? commonT("updating") : t("updatePassword")}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">{t("languageRegion")}</Label>
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm">{t("currentLanguage")}</span>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <h4 className="font-semibold text-destructive">{t("dangerZone")}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("deleteAccountDesc")}
                </p>
                <Button variant="destructive" size="sm" className="mt-3">
                  {t("deleteAccount")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
