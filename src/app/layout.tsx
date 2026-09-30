import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionGate } from "@/components/AuthSessionGate";

export const metadata: Metadata = {
  title: "Metaphorical 日志管理",
  description: "日志上报与查看系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased min-h-screen bg-gray-50"
      >
        <AuthSessionGate>
          <Navbar />
          <main className="w-full px-4 py-8">
            {children}
          </main>
          <Toaster />
        </AuthSessionGate>
      </body>
    </html>
  );
}
