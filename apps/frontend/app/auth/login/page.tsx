"use client";
import AlreadyLoggedIn from "@/components/composites/auth/already-logged-in";
import LoginForm from "@/components/composites/auth/login-form";
import { authClient } from "@/lib/auth-client";

const LoginPage = () => {
    const { data: session } = authClient.useSession();
    // TODO: Loading indicator
    if (session) return <AlreadyLoggedIn />;

    return <LoginForm />;
};

export default LoginPage;
