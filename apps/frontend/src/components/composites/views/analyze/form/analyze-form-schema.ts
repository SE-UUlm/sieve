import z from "zod";

/**
 * Validation schema for the analyze email form.
 */
export const analyzeFormSchema = z.object({
    sender: z.union([z.email("Invalid email address."), z.literal("")]),
    subject: z.string().max(300, "Subject must be at most 300 characters."),
    emailContent: z
        .string()
        .min(1, "Email content must be at least 1 character."),
});

/**
 * Type-safe values inferred from {@link analyzeFormSchema}.
 */
export type AnalyzeFormValues = z.infer<typeof analyzeFormSchema>;
