"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type UseLogoutOptions = {
    redirectTo?: string;
};

const useLogout = ({ redirectTo = "/auth/login" }: UseLogoutOptions = {}) => {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const logout = useCallback(async () => {
        if (isPending) return;

        setIsPending(true);
        try {
            const result = await authClient.signOut();

            if (result.error) {
                toast.error("Error while logging out", {
                    description: result.error.message,
                });
                return;
            }

            router.push(redirectTo);
        } catch {
            toast.error("Error while logging out", {
                description: "Please try again.",
            });
        } finally {
            setIsPending(false);
        }
    }, [isPending, redirectTo, router]);

    return { isPending, logout };
};

export default useLogout;
