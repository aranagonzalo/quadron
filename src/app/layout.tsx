import type { Metadata } from "next";
import "./globals.css";

import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/src/components/ThemeProvider";

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-plus-jakarta",
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: "Quadron",
    description: "Gestión financiera personal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={plusJakarta.variable}>
            <body className="font-sans">
                <ThemeProvider>
                    {children}
                </ThemeProvider>
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
