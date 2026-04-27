import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { themeConfig } from "@/lib/theme-config";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: themeConfig.brandName,
  description: themeConfig.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeStyle = {
    "--background": themeConfig.colors.background,
    "--foreground": themeConfig.colors.foreground,
    "--muted": themeConfig.colors.muted,
    "--surface": themeConfig.colors.surface,
    "--border": themeConfig.colors.border,
    "--accent": themeConfig.colors.accent,
    "--accent-strong": themeConfig.colors.accentStrong,
    "--danger": themeConfig.colors.danger,
    "--card": themeConfig.colors.surface,
    "--card-foreground": themeConfig.colors.foreground,
    "--popover": "#090a08",
    "--popover-foreground": themeConfig.colors.foreground,
    "--primary": themeConfig.colors.accent,
    "--primary-foreground": "#081004",
    "--secondary": themeConfig.colors.surface,
    "--secondary-foreground": themeConfig.colors.foreground,
    "--muted-foreground": themeConfig.colors.muted,
    "--accent-foreground": "#081004",
    "--destructive": themeConfig.colors.danger,
    "--input": themeConfig.colors.border,
    "--ring": themeConfig.colors.accent,
  } as CSSProperties;

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body style={themeStyle}>
        {children}
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
