import { Copy } from "lucide-react";
import { toast } from "sonner";

type CopyActionButtonProps = {
    title: string;
    copyText: string;
};

/**
 * Renders a shared icon-only copy action button.
 */
export function CopyActionButton({ title, copyText }: CopyActionButtonProps) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(copyText);
            toast.success("Copied to Clipboard");
        } catch (error) {
            console.error("[analyze] Failed to copy text", error);
            toast.error("Copy Failed", {
                description: "Could not copy to clipboard. Please try again.",
            });
        }
    };

    return (
        <button
            className="absolute top-3 right-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white"
            title={title}
            aria-label={title}
            type="button"
            onClick={handleCopy}
        >
            <Copy size={14} />
        </button>
    );
}
