import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time With Mom",
  description: "Instant video calling and messaging to stay connected with the people you love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}