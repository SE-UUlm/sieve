import AuthForm from "@/components/auth/AuthForm";
import Hero from "./_components/Hero";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
    return (
        <main className="flex flex-col p-4 lg:p-24">
            <Hero />
            <div className="mx-auto flex gap-4">
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
            </div>
        </main>
    );
}
