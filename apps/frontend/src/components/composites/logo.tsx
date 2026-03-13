import Image from "next/image";
import Link from "next/link";
import sieveLogo from "../../../public/sieve-logo.svg";

export function Logo() {
    return (
        <Link
            href="/analyze"
            className="mb-10 block"
            aria-label="Go to Analyze"
        >
            <Image src={sieveLogo} alt="SIEVE Logo" />
        </Link>
    );
}
