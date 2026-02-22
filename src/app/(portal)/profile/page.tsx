"use client";
export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, Building2, Shield, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas";
import { useUser, useUserProfile } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const [editing, setEditing] = useState(false);
  const t = useTranslations("Profile");
  const commonT = useTranslations("Common");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: (profile as any).location || "",
        bio: (profile as any).bio || "",
      });
    }
  }, [profile, reset]);

  if (userLoading || (profileLoading && !profile)) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse flex items-center justify-center h-full">
        {t("loadingProfile")}
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-muted-foreground">{t("profileNotFound")}</div>;
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    const { error } = await supabase
      .from("users")
      .update({
        email: data.email,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    if (!error) {
      await logAudit("Update", "User", "Updated own profile");
      setEditing(false);
      window.location.reload(); // Quick refresh to update state smoothly
    } else {
      console.error("Failed to update profile", error);
    }
  };

  const handleCancel = () => {
    reset({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      location: (profile as any)?.location || "",
      bio: (profile as any)?.bio || "",
    });
    setEditing(false);
  };

  // Calculate dynamic avatar
  const userName = profile.name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subHeader")}</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground ring-4 ring-primary/20">
              {userInitials}
            </div>
            <div className="flex-1 text-center sm:text-start">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.role}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">
                  <Building2 className="me-1 size-3" />
                  {profile.department || commonT("unknown")}
                </Badge>
                <Badge variant="outline">
                  <Shield className="me-1 size-3" />
                  {profile.role}
                </Badge>
                <Badge
                  variant="success"
                  className={
                    profile.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-destructive/10 text-destructive"
                  }
                >
                  {profile.status}
                </Badge>
              </div>
            </div>
            <Button
              variant={editing ? "destructive" : "outline"}
              onClick={editing ? handleCancel : () => setEditing(true)}
            >
              {editing ? (
                <>
                  <X className="me-2 size-4" />
                  {commonT("cancel")}
                </>
              ) : (
                <>
                  <Edit2 className="me-2 size-4" />
                  {t("editProfile")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contactInfo")}</CardTitle>
              <CardDescription>{t("contactInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{commonT("email")}</Label>
                {editing ? (
                  <div>
                    <Input id="email" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    {profile.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{commonT("phone")}</Label>
                {editing ? (
                  <div>
                    <Input id="phone" {...register("phone")} aria-invalid={!!errors.phone} />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    {profile.phone || commonT("unknown")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{commonT("location")}</Label>
                {editing ? (
                  <div>
                    <Input
                      id="location"
                      {...register("location")}
                      aria-invalid={!!errors.location}
                    />
                    {errors.location && (
                      <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {(profile as any).location || commonT("unknown")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Details (Read Only) */}
          <Card>
            <CardHeader>
              <CardTitle>{t("employeeDetails")}</CardTitle>
              <CardDescription>{t("employeeDetailsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{commonT("department")}</Label>
                  <p className="text-sm font-medium">{profile.department || commonT("unknown")}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{commonT("role")}</Label>
                  <p className="text-sm font-medium">{profile.role}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{commonT("status")}</Label>
                  <p className="text-sm font-medium">{profile.status}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{commonT("joinDate")}</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="size-3 text-muted-foreground" />
                    {new Date(profile.join_date || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio (Full Width) */}
        <Card className="mt-6 md:col-span-2">
          <CardHeader>
            <CardTitle>{t("aboutMe")}</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t("bioPlaceholder")}
                  {...register("bio")}
                  aria-invalid={!!errors.bio}
                />
                {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(profile as any).bio || t("noBio")}
              </p>
            )}
          </CardContent>
        </Card>

        {editing && (
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="me-2 size-4" />
              {isSubmitting ? commonT("saving") : t("saveChanges")}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
