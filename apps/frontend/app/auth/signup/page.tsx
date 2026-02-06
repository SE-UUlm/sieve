"use client";
import AlreadyLoggedIn from "@/components/composites/auth/already-logged-in";
import SignUpForm from "@/components/composites/auth/sign-up-form";
import { authClient } from "@/lib/auth-client";

const SignupPage = () => {
    const { data: session } = authClient.useSession();
    // TODO: Loading indicator
    if (session) return <AlreadyLoggedIn />;

    return <SignUpForm />;
};

export default SignupPage;
