import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useLogout from "@/hooks/useLogout";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const NavBarAuthSection = () => {
    const { data: session, isPending, error } = authClient.useSession();
    const user = session?.user;

    const { isPending: isLogoutPending, mutate: logout } = useLogout();

    if (error) return <div className="text-destructive">Error loading session</div>;

    if (isPending) return <Skeleton className="h-8 w-45" />;

    if (user)
        return (
            <>
                <div>User: {user.name}</div>
                <Button onClick={logout} disabled={isLogoutPending}>
                    Logout
                </Button>
            </>
        );

    return (
        <>
            <Button variant="default" asChild>
                <Link href="/auth/signup">Sign up</Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/auth/login">Login</Link>
            </Button>
        </>
    );
};

export default NavBarAuthSection;
