"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";
import { Plus, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconPicker } from "@/components/ui/icon-picker";
import { useAnnouncementCategories } from "@/hooks/use-announcement-categories";
import { useTranslations } from "next-intl";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryName: string) => void;
}

export function CategoryManager({ open, onOpenChange, onCategoryCreated }: CategoryManagerProps) {
  const t = useTranslations("Admin");
  const commonT = useTranslations("Common");
  const { addCategory } = useAnnouncementCategories();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Megaphone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t("categoryNameRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await addCategory(name.trim(), icon);

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setName("");
      setIcon("Megaphone");
      setLoading(false);
      onOpenChange(false);
      if (onCategoryCreated) {
        onCategoryCreated(name.trim());
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("newCategory")}</DialogTitle>
          <DialogDescription>
            {t("newCategoryDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">{t("categoryName")}</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("categoryNamePlaceholder")}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("categoryIcon")}</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {commonT("cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="me-2 size-4 animate-spin" />}
            {t("createCategory")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
