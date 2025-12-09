"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { redirect, RedirectType } from "next/navigation";

const AnalysePage = () => {
    const { data: session, isPending, error } = authClient.useSession();

    if (!isPending && !error && !session?.user) redirect("/auth/login", RedirectType.push);

    return (
        <main className="mx-auto flex max-w-6xl flex-col gap-12 p-4 lg:p-24">
            <form className="flex flex-col gap-4">
                <h1>Analyse Email</h1>
                <Textarea placeholder="Paste your email here" />
                <Button size="lg">Analyse</Button>
            </form>
            <div className="flex flex-col gap-4">
                <h2>Result</h2>
                <Textarea readOnly />
            </div>
        </main>
    );
};

export default AnalysePage;
