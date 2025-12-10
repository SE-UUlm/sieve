"use client";
import AlreadyLoggedIn from "@/components/auth/AlreadyLoggedIn";
import LoginForm from "@/components/auth/LoginForm";
import { authClient } from "@/lib/auth-client";

const LoginPage = () => {
    const { data: session } = authClient.useSession();
    // TODO: Loading indicator
    if (session) return <AlreadyLoggedIn />;

    return <LoginForm />;
};

export default LoginPage;
