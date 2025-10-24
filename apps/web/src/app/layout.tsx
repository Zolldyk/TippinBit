import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Web3ErrorBoundary } from "@/components/providers/Web3ErrorBoundary";
import { WebVitalsInit } from "@/components/providers/WebVitalsInit";
import { Header } from "@/components/organisms/Header";
import { SkipLink } from "@/components/atoms/SkipLink";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TippinBit",
  description: "Tip anyone on X with Bitcoin-backed MUSD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SkipLink />
        <WebVitalsInit />
        <Web3ErrorBoundary>
          <Web3Provider>
            <Header />
            <main id="main-content">
              {children}
            </main>
          </Web3Provider>
        </Web3ErrorBoundary>
        <Toaster position="bottom-center" duration={3000} />
      </body>
    </html>
  );
}
