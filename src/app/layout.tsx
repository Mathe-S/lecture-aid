import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@/providers/QueryClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lecture+",
  description: "A platform for students, lecturers, and administrators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50`}
      >
        <QueryClientProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <footer className="py-6 border-t border-slate-200 bg-white">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                  © {new Date().getFullYear()} Lecture+. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
