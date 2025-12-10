"use client";
import Hero from "./_components/Hero";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function Home() {
    const { data: session } = authClient.useSession();

    return (
        <main className="flex flex-col p-4 lg:p-24">
            <Hero />
            <div className="mx-auto flex gap-4">
                {session?.user ? (
                    <Button variant="default" asChild size={"lg"}>
                        <Link href="/analyse" className="text-xl">
                            Start Analysing Emails
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button variant="default" asChild size={"lg"}>
                            <Link href="/auth/signup" className="text-xl">
                                Sign up for Sieve
                            </Link>
                        </Button>
                        <Button variant="outline" asChild size={"lg"}>
                            <Link href="/auth/login" className="text-xl">
                                Login
                            </Link>
                        </Button>
                    </>
                )}
            </div>
        </main>
    );
}
