import type { Metadata } from "next";
import { Bitter } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://palapia.com";
const siteName = "Palapia";
const siteDescription = "Save, create, and share recipes effortlessly. AI-powered recipe import from social media, photo analysis, and smart meal planning. Join thousands of home cooks making meal planning effortless.";
  
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Palapia - AI-Powered Recipe Management & Cooking App",
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "recipe app",
    "cooking app",
    "meal planning",
    "AI recipes",
    "recipe management",
    "food app",
    "social cooking",
    "recipe organizer",
    "cooking recipes",
    "meal prep",
    "recipe sharing",
    "cooking community",
    "recipe finder",
    "home cooking",
    "recipe collection",
  ],
  authors: [{ name: "Palapia Team" }],
  creator: "Palapia",
  publisher: "Palapia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: "Palapia - AI-Powered Recipe Management & Cooking App",
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/assets/headerlogo.png`,
        width: 1200,
        height: 630,
        alt: "Palapia - AI-Powered Recipe Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Palapia - AI-Powered Recipe Management & Cooking App",
    description: siteDescription,
    images: [`${siteUrl}/assets/headerlogo.png`],
    creator: "@PalapiaApp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon1.ico", sizes: "any" },
      { url: "/favicon2.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  category: "Food & Cooking",
  classification: "Recipe Management Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://palapia.com";
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Palapia",
    "applicationCategory": "Food & Drink",
    "operatingSystem": "iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "50000",
    },
    "description": siteDescription,
    "url": siteUrl,
    "logo": `${siteUrl}/assets/headerlogo.png`,
    "screenshot": `${siteUrl}/assets/recipepage.jpeg`,
    "featureList": [
      "AI-powered recipe import from social media",
      "Photo analysis for recipe extraction",
      "Recipe organization and management",
      "Meal planning tools",
      "Social recipe sharing",
      "Household management",
    ],
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Palapia",
    "url": siteUrl,
    "logo": `${siteUrl}/assets/headerlogo.png`,
    "description": siteDescription,
    "sameAs": [
      "https://www.facebook.com/PalapiaApp",
      "https://www.instagram.com/PalapiaApp",
      "https://www.twitter.com/PalapiaApp",
      "https://www.linkedin.com/company/PalapiaApp",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@palapiaapp.com",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Palapia",
    "url": siteUrl,
    "description": siteDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${bitter.variable} antialiased`} style={{ fontFamily: 'var(--font-bitter), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
