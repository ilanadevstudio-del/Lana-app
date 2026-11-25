import type { Metadata, Viewport } from "next";
import { Geist_Mono, Urbanist } from "next/font/google";
import { Backdrop } from "@/components/backdrop";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const sans = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lana",
  description: "Your personal AI assistant. Less managing. More doing.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0a1c" },
  ],
};

// Runs before first paint: saved preference wins, otherwise follow the OS.
const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
