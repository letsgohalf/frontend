import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import AuthPrompt from "@/components/AuthPrompt";
import SurveyPopup from "@/components/SurveyPopup";
import VerificationNudgePopup from "@/components/VerificationNudgePopup";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://letsgohalf.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LetsGoHalf — Find your perfect match to split bills or costs",
    template: "%s | LetsGoHalf",
  },
  description: "Find your perfect match to split bills or costs. Connect with verified users, share apartments, split subscriptions, carpool, and save up to 50%. Join thousands finding their perfect match.",
  keywords: [
    "split bills",
    "find your perfect match",
    "split bills or cost",
    "cost splitting app",
    "split bills or cost",
    "find your perfect match",
    "roommate finder",
    "roommate finder ",
    "roommate finder ",
    "roommate finder ",
    "roommate finder ",
  ],
  authors: [{ name: "LetsGoHalf" }],
  creator: "LetsGoHalf",
  publisher: "LetsGoHalf",
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LetsGoHalf",
  },
  openGraph: {
    title: "LetsGoHalf — Find your perfect match to split bills or costs",
    description: "Find your perfect match to split bills or costs. Connect with verified users, share apartments, split subscriptions, carpool, and save up to 50%.",
    url: siteUrl,
    siteName: "LetsGoHalf",
    locale: "en_US",
    type: "website",
    // Images auto-generated from opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "LetsGoHalf — Find your perfect match to split bills or costs",
    description: "Find your perfect match to split bills or costs. Connect with verified users, share apartments, split subscriptions, carpool, and save up to 50%.",
    // Images auto-generated from twitter-image.tsx
    creator: "@letsgohalf",
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
  verification: {
    google: "a67a45473095ac8a", // From googlea67a45473095ac8a.html
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d9488" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "LetsGoHalf",
              "description": "Find your perfect match to split bills or costs. Connect with verified users, share costs, and save up to 50% on living expenses. Join thousands finding their perfect match.",
              "url": "https://letsgohalf.com",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              },
              "author": {
                "@type": "Organization",
                "name": "LetsGoHalf",
                "url": "https://letsgohalf.com"
              }
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "LetsGoHalf",
              "url": "https://letsgohalf.com",
              "logo": "https://letsgohalf.com/logo/letsgohalf-main-logo.png",
              "sameAs": [
                "https://twitter.com/letsgohalf",
                "https://instagram.com/hello_letsgohalf"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            }),
          }}
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var pref = localStorage.getItem('theme-preference') || localStorage.getItem('theme') || 'system';
                if (pref === 'midnight' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        {/* Noscript fallback for users without JS or when JS fails to load */}
        <noscript>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: '#f8f6f3',
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#1a1a1a' }}>
              LetsGoHalf
            </h1>
            <p style={{ color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
              This app requires JavaScript to run. Please enable JavaScript in your browser settings, 
              or try a different browser.
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Having trouble? Try refreshing the page or switching networks.
            </p>
          </div>
        </noscript>

        {/* Initial loading state - hidden once React hydrates */}
        <div id="initial-loader" style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f6f3',
          zIndex: 9999,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e5e5',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Loading...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Hide loader once page is interactive
          if (document.getElementById('initial-loader')) {
            window.addEventListener('load', function() {
              setTimeout(function() {
                var loader = document.getElementById('initial-loader');
                if (loader) loader.style.display = 'none';
              }, 100);
            });
            // Fallback: hide after 10 seconds regardless
            setTimeout(function() {
              var loader = document.getElementById('initial-loader');
              if (loader) loader.style.display = 'none';
            }, 10000);
          }
        `}} />

        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <ToastProvider>
                <ConfirmProvider>
                <PremiumProvider>
                  {children}
                  <AuthPrompt />
                  <VerificationNudgePopup />
                  {/* <SurveyPopup /> — suspended */}
                  <AnnouncementBanner />
                </PremiumProvider>
                </ConfirmProvider>
              </ToastProvider>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
