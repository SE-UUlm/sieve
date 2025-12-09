import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

const useLogout = () => {
    const { refetch } = authClient.useSession();
    const [pending, setPending] = useState(false);

    const handleLogout = () => {
        setPending(true);
        authClient.signOut({
            fetchOptions: {
                onSuccess: async () => {
                    // Not quite optimal, because get-session is called twice. But it seems to be the most robust way
                    await refetch();
                    setPending(false);
                },
                onError: async (error) => {
                    console.log(error);
                    toast.error("Error while logging out", {
                        description: error.error.message,
                    });
                    setPending(false);
                },
            },
        });
    };

    return {
        isPending: pending,
        mutate: handleLogout,
    };
};

export default useLogout;
