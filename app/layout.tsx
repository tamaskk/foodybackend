import type { Metadata } from "next";
import { Bitter } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});
  
export const metadata: Metadata = {
  title: "Foody - AI-Powered Recipe Management",
  description: "Save, create, and share recipes effortlessly. AI-powered recipe import from social media, photo analysis, and smart meal planning.",
  keywords: "recipe app, cooking, meal planning, AI recipes, food, social cooking",
  openGraph: {
    title: "Foody - AI-Powered Recipe Management",
    description: "Save, create, and share recipes effortlessly with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bitter.variable} antialiased`} style={{ fontFamily: 'var(--font-bitter), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
