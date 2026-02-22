"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_ICONS = [
  "Megaphone",
  "Users",
  "Monitor",
  "Landmark",
  "ShieldAlert",
  "CalendarDays",
  "Bell",
  "Info",
  "CheckCircle2",
  "AlertTriangle",
  "FileText",
  "Settings",
  "Heart",
  "Star",
  "Zap",
  "Smile",
  "Flag",
  "Mail",
  "Phone",
  "Globe",
  "Lock",
  "Unlock",
  "Eye",
  "EyeOff",
  "Trash2",
  "Edit",
  "Plus",
  "Minus",
  "ExternalLink",
  "Briefcase",
  "Handshake",
  "Award",
  "Target",
  "TrendingUp",
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [customSvg, setCustomSvg] = useState(value.startsWith("<svg") ? value : "");

  const filteredIcons = COMMON_ICONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSvgChange = (val: string) => {
    setCustomSvg(val);
    if (val.trim().startsWith("<svg")) {
      onChange(val);
    }
  };

  const isCurrentIconLucide = (name: string) => value === name;

  const renderIcon = (name: string) => {
    const Icon = (LucideIcons as any)[name];
    if (!Icon) return null;
    return <Icon className="size-5" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <ScrollArea className="h-48 rounded-md border p-2">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map((name) => (
              <TooltipProvider key={name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isCurrentIconLucide(name) ? "default" : "outline"}
                      size="icon"
                      className="size-9 p-0"
                      onClick={() => {
                        onChange(name);
                        setCustomSvg("");
                      }}
                    >
                      {renderIcon(name)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or paste SVG</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste <svg> code here..."
            value={customSvg}
            onChange={(e) => handleSvgChange(e.target.value)}
            className="font-mono text-xs"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px]">
                <p>
                  Paste raw SVG code starting with &lt;svg&gt;. Ensure it has currentcolor
                  stroke/fill for best results.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
