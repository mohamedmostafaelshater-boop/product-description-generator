import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "مولد وصف المنتجات بالذكاء الاصطناعي",
  description: "أداة لتوليد أوصاف منتجات احترافية بالعربي لأصحاب المتاجر الإلكترونية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans`}>{children}</body>
    </html>
  );
}
