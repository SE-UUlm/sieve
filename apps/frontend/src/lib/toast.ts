import { toast } from "sonner";

type ErrorToastOptions = {
    title: string;
    description?: string;
    id?: string | number;
};

type SuccessToastOptions = {
    title: string;
    description?: string;
    id?: string | number;
};

/**
 * Shows a persistent error toast that must be dismissed manually.
 *
 * @param options Toast content and error details.
 * @param options.title Main error title.
 * @param options.description Optional custom description.
 * @param options.id Optional toast ID for deduplication.
 * @returns The created toast ID.
 */
export function showPersistentErrorToast({
    title,
    description,
    id,
}: ErrorToastOptions): string | number {
    const message = description ?? "An unexpected error occurred.";

    return toast.error(title, {
        id,
        description: message,
        duration: Number.POSITIVE_INFINITY,
        closeButton: true,
    });
}

/**
 * Shows a standard success toast.
 *
 * @param options Toast content.
 * @param options.title Main success title.
 * @param options.description Optional custom description.
 * @param options.id Optional toast ID for deduplication.
 * @returns The created toast ID.
 */
export function showSuccessToast({
    title,
    description,
    id,
}: SuccessToastOptions): string | number {
    return toast.success(title, {
        id,
        description,
    });
}
