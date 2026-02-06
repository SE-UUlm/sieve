import type { Metadata } from "next";

import "./globals.css";
import type React from "react";
import { ThemeProvider } from "@/components/composites/theme/theme-provider";
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
                <link
                    rel="icon"
                    href="icon?<generated>"
                    type="<generated>"
                    sizes="<generated>"
                />
                <Providers>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        {children}
                    </ThemeProvider>
                </Providers>
            </body>
        </html>
    );
}
