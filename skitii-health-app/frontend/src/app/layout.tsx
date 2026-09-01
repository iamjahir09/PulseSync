import type { Metadata } from "next";
import { ToastProvider } from "@/components/ToastContainer";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseSync - Patient Monitoring",
  description: "Healthcare patient management with BLE monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}