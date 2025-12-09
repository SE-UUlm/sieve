"use client";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import NavBarAuthSection from "./NavBarAuthSection";

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
    return (
        <header className="mx-auto flex h-11 max-w-6xl justify-center gap-10 px-4 pt-5 lg:px-24">
            <NavigationMenu className="grow">
                <NavigationMenuList className="gap-10">
                    <NavigationMenuItem>
                        <Link href="/">Home</Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="/analyse">Analyse Email</Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center gap-4">
                <NavBarAuthSection />
            </div>
        </header>
    );
};

export default NavBar;
