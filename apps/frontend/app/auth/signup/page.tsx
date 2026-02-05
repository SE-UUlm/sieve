"use client";
import AlreadyLoggedIn from "@/components/auth/AlreadyLoggedIn";
import SignUpForm from "@/components/auth/SignUpForm";
import { authClient } from "@/lib/auth-client";

const SignupPage = () => {
    const { data: session } = authClient.useSession();
    // TODO: Loading indicator
    if (session) return <AlreadyLoggedIn />;

    return <SignUpForm />;
};

export default SignupPage;
