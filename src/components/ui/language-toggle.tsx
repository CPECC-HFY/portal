"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLanguageCookie } from "@/app/actions/locale";

export function LanguageToggle() {
    const currentLocale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();

    const handleLanguageChange = (locale: string) => {
        startTransition(async () => {
            await setLanguageCookie(locale);
            router.refresh();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" disabled={isPending}>
                    <Globe className="size-4" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("en")}
                    disabled={isPending}
                    className="justify-between"
                >
                    English
                    {currentLocale === "en" && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("ar")}
                    disabled={isPending}
                    className="justify-between"
                >
                    العربية
                    {currentLocale === "ar" && <Check className="size-4" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
