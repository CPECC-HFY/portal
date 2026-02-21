"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  File,
  Paperclip,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export interface Attachment {
  id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

interface FileUploaderProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  className?: string;
}

export function FileUploader({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  className,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const newAttachments: Attachment[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" is too large (max ${maxSizeMB}MB).`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `announcement_files/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("announcements")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            // @ts-ignore - Storage types might be slightly out of sync in some environments
            onUploadProgress: (progressEvent: any) => {
              if (progressEvent.total) {
                const p = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                setProgress(p);
              }
            },
          });

        if (uploadError) throw uploadError;

        newAttachments.push({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        setError(`Failed to upload "${file.name}": ${err.message}`);
      }
    }

    onChange(newAttachments);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (index: number) => {
    const fileToRemove = attachments[index];
    try {
      await supabase.storage.from("announcements").remove([fileToRemove.file_path]);
      const newAttachments = attachments.filter((_, i) => i !== index);
      onChange(newAttachments);
    } catch (err) {
      console.error("Error removing file:", err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="size-4" />;
    if (type === "application/pdf") return <FileText className="size-4 text-red-500" />;
    if (type.includes("word")) return <File className="size-4 text-blue-500" />;
    return <Paperclip className="size-4 text-muted-foreground" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Attachments
        </Label>
        <span className="text-[10px] text-muted-foreground font-medium">
          {attachments.length} / {maxFiles} files
        </span>
      </div>

      {/* List of current attachments */}
      {attachments.length > 0 && (
        <div className="grid gap-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-md bg-background border shadow-sm">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{file.file_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatSize(file.file_size)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAttachment(idx)}
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Box */}
      {attachments.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
            uploading
              ? "opacity-50 pointer-events-none"
              : "hover:border-primary/50 hover:bg-primary/5",
            error ? "border-destructive/30 bg-destructive/5" : "border-muted-foreground/20"
          )}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-3 p-3 rounded-full",
                error ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Upload className="size-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {uploading ? "Uploading bits..." : "Add documents or images"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Upload any format up to {maxSizeMB}MB
              </p>
            </div>
          </div>

          {uploading && (
            <div className="absolute inset-x-4 bottom-4">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-[11px] text-destructive bg-destructive/10 p-2 rounded-md animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
