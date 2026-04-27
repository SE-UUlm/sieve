"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { showPersistentErrorToast } from "@/lib/toast";

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
                console.error(
                    "[auth] Logout failed with API error",
                    result.error,
                );
                showPersistentErrorToast({
                    title: "Error While Logging Out",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
                return;
            }

            router.push(redirectTo);
        } catch (error) {
            console.error("[auth] Logout failed with unexpected error", error);
            showPersistentErrorToast({
                title: "Error While Logging Out",
                description:
                    "There was an issue with the server. Please try again later.",
            });
        } finally {
            setIsPending(false);
        }
    }, [isPending, redirectTo, router]);

    return { isPending, logout };
};

export default useLogout;
