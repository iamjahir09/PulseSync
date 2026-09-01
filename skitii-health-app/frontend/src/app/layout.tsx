import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";   // ✅ YAHAN "./styles/globals.css" NAHI, SIRF "./globals.css"

export const metadata: Metadata = {
  title: "Skitii Health Tech",
  description: "Patient Management with BLE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}