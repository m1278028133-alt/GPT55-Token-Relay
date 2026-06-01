import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPT-5.5 Token Relay",
  description: "Prepaid API relay with automated balance checks and payment webhooks."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
