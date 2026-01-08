import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://palapia.com";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch with Palapia Support",
  description: "Have a question, suggestion, or feedback? Contact Palapia support team. We're here to help with technical support, feature requests, bug reports, and general inquiries. Get in touch today!",
  keywords: [
    "contact Palapia",
    "Palapia support",
    "recipe app support",
    "cooking app help",
    "customer service",
    "technical support",
    "feedback",
  ],
  openGraph: {
    title: "Contact Us - Get in Touch with Palapia Support",
    description: "Have a question, suggestion, or feedback? Contact Palapia support team. We're here to help!",
    url: `${siteUrl}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Us - Get in Touch with Palapia Support",
    description: "Have a question, suggestion, or feedback? Contact Palapia support team.",
  },
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
