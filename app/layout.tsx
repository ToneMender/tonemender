import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ToneMender – AI Relationship & Tone Assistant",
  description: "ToneMender is an AI-powered relationship and tone assistant. Say it better. Save it together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Structured SEO Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ToneMender",
              description:
                "ToneMender is an AI-powered relationship and tone assistant that helps improve communication by rewriting messages more clearly and kindly.",
              applicationCategory: "CommunicationApplication",
              operatingSystem: "Web, iOS, Android",
              url: "https://tonemender.com",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "ToneMender",
              },
            }),
          }}
        />
      </head>

      <body className="min-h-screen flex flex-col">
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>

        {/* ✅ Global Footer */}
        <footer className="border-t py-6 text-sm text-gray-500">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} ToneMender</span>

            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-gray-700">
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}