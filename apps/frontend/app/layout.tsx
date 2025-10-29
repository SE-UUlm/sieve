import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: "Sieve",
    description: "Convert Bad Emails into purchase orders",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
