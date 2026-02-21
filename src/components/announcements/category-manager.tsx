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

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryName: string) => void;
}

export function CategoryManager({ open, onOpenChange, onCategoryCreated }: CategoryManagerProps) {
  const { addCategory } = useAnnouncementCategories();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Megaphone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Category name is required");
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
          <DialogTitle>New Category</DialogTitle>
          <DialogDescription>
            Add a new category for announcements with a custom icon.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Category Icon</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
