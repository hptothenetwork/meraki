import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Backend Bundle",
  description: "Standalone admin dashboard and API backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-mubah-deep text-mubah-cream antialiased">{children}</body>
    </html>
  );
}
