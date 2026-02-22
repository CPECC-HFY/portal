"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OfflinePage() {
  const t = useTranslations("Common");
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Icon */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-muted/60 backdrop-blur-sm">
          <WifiOff className="size-10 text-muted-foreground" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("offlineTitle")}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("offlineDesc")}
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
        >
          <RefreshCw className="size-4" />
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
