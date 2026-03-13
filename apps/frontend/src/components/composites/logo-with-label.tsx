import Image from "next/image";
import { cn } from "@/lib/utils/shadcn-helper";
import sieveLogo from "../../../public/sieve-logo.svg";

type LogoWithLabelProps = {
    className?: string;
};

export function LogoWithLabel({ className }: LogoWithLabelProps) {
    return (
        <div className={cn("mb-10 flex items-center gap-3", className)}>
            <Image src={sieveLogo} alt="SIEVE Logo" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sieve
            </span>
        </div>
    );
}
