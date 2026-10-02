import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 사주 풀이",
  description: "만세력으로 사주를 계산하고 Claude가 풀이해 드립니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
