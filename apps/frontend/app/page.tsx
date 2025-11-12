import AuthForm from "@/components/auth/AuthForm";
import Hero from "./_components/Hero";

export default function Home() {
    return (
        <main className="flex flex-col p-4 lg:p-24 2xl:flex-row">
            <Hero />
            <AuthForm />
        </main>
    );
}
