import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";



export const metadata: Metadata = {
  title: "Themis - Mobile App Compliance",
  description: "Automated compliance checking for Apple App Store and Google Play Store",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
