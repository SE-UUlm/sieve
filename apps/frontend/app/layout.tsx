import type { Metadata } from "next";

import "./globals.css";
import type React from "react";
import Providers from "./providers";

export const metadata: Metadata = {
    title: "Sieve",
    description: "Convert Bad Emails into Purchase Orders",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
