import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Providers } from "@/app/providers";
import { CyberBackground } from "@/components/layout/CyberBackground";

export const metadata: Metadata = {
  title: "Fii Global English — 海外案件で戦う実務英会話",
  description:
    "中村諭律 専用。海外クライアントとヒアリングから納品まで英語で完遂するための実務英会話コーチ。マスコットは Fii。",
};

export const viewport: Viewport = {
  themeColor: "#070c16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <CyberBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
