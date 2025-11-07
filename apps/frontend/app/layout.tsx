import type { Metadata } from "next";

import "./globals.css";
import NavBar from "./_components/NavBar";

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
        <html lang="en">
            <body>
                <NavBar />
                {children}
            </body>
        </html>
    );
}
