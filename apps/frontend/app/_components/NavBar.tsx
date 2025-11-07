"use client";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";

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

const NavBar = () => (
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

export default NavBar;
