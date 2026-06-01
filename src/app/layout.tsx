import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPTX API",
  description: "Prepaid GPT-5.5 API access with PayPal checkout and OpenAI-compatible endpoints."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
