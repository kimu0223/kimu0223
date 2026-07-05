import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchNote — サッカー指導者のためのプラットフォーム",
  description:
    "AIによる指導案の提案と、指導者同士の知見共有。サッカー指導者専用プラットフォーム。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
