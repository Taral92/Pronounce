import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Pronounce — Speak Like a Native",
  description: "AI-powered pronunciation coach for English, German and Spanish.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
