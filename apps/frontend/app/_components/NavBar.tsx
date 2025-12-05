"use client";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth-client";
import { useUserControllerGetUsers } from "@/lib/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

const Link = ({ href, ...props }: React.ComponentProps<typeof NextLink>) => {
    const pathname = usePathname();
    const isActive = href === pathname;

    return (
        <NavigationMenuLink asChild active={isActive}>
            <NextLink href={href} {...props} />
        </NavigationMenuLink>
    );
};

// TODO: Move somewhere more global
const queryClient = new QueryClient();

const NavBar = () => (
    <QueryClientProvider client={queryClient}>
        <NavBarInner />
    </QueryClientProvider>
);

const NavBarInner = () => {
    const { data: users } = useUserControllerGetUsers({
        limit: 10,
        role: "admin",
        page: 0,
    });

    console.log(users);

    const {
        data: session,
        isPending, //loading state
        error, //error object
        refetch, //refetch the session
    } = authClient.useSession();

    const user = session?.user;

    console.log(session);

    const loginAction = async () => {
        const { data, error } = await authClient.signIn.email({
            email: "john.doe@example.com",
            password: "strongPassword123!",
        });

        console.log("Logged in");
        console.log(data);
        console.log(error);
    };

    const logoutAction = async () => {
        const { data, error } = await authClient.signOut();

        console.log("Logged out");
        console.log(data);
        console.log(error);
    };

    return (
        <NavigationMenu className="mx-auto h-11 max-w-6xl px-4 pt-5 lg:px-24">
            <NavigationMenuList className="gap-10">
                <NavigationMenuItem>
                    <Link href="/">Home</Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/analyse">Analyse Email</Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <div>User: {user?.name}</div>
                    <Button onClick={loginAction}>Login</Button>
                    <Button onClick={logoutAction}>Logout</Button>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
};

export default NavBar;
