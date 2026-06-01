import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPTX API",
  description: "Prepaid GPT-5.5 API access with PayPal checkout and OpenAI-compatible endpoints.",
  other: {
    google: "notranslate"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body>{children}</body>
    </html>
  );
}
