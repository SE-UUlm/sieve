"use client";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useAuthControllerLogout, useAuthControllerMe } from "@/lib/client";

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

const NavBar = () => {
    const { data: user, isLoading } = useAuthControllerMe();
    const { mutateAsync, isPending } = useAuthControllerLogout();
    return (
        <NavigationMenu className="mx-auto h-11 max-w-6xl px-4 pt-5 lg:px-24">
            <NavigationMenuList className="gap-10">
                <NavigationMenuItem>
                    <Link href="/">Home</Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/analyse">Analyse Email</Link>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
};

export default NavBar;
