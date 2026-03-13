"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarActionButton } from "@/components/composites/sidebar/sidebar-action-button";

type ThemeToggleButtonProps = {
    className?: string;
};

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const isDark = (resolvedTheme ?? theme) === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <SidebarActionButton
            icon={isDark ? Sun : Moon}
            label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={toggleTheme}
            className={className}
        />
    );
}
