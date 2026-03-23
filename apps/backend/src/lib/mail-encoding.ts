/**
 * Decodes Quoted-Printable encoded text to UTF-8 string.
 * Handles common mail encoding issues like:
 * - r=C3=BCckg=C3=A4ngig -> rückgängig
 * - besch= wer -> beschweren (soft line breaks)
 * - rC3=BCckg= C3=A4ngig -> rückgängig (missing = before hex)
 */
export function decodeQuotedPrintable(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    // Check if input contains QP sequences
    if (!input.includes("=") && !/[0-9A-Fa-f]{4}/.test(input)) {
        return input;
    }

    try {
        let decoded = input;

        // Step 1: Remove soft line breaks (= followed by \r\n or \n)
        decoded = decoded.replace(/=\r?\n/g, "");

        // Step 2: Handle soft line breaks where newlines were already removed
        // Pattern: = followed by whitespace(s) and letter
        decoded = decoded.replace(/=(?=\s*[a-zA-ZäöüÄÖÜß])/g, "");

        // Step 3: Fix missing = before hex sequences (common QP corruption)
        // Pattern: letter + XXYY + letter (where XXYY is hex for UTF-8)
        // Common UTF-8 patterns: C3XX (äöüß), C2XX (special chars), etc.
        decoded = decoded.replace(
            /([a-zA-Z])(C3[0-9A-Fa-f]{2})([a-zA-Z])/g,
            "$1=$2=$3",
        );
        decoded = decoded.replace(
            /([a-zA-Z])(C2[0-9A-Fa-f]{2})([a-zA-Z])/g,
            "$1=$2=$3",
        );
        decoded = decoded.replace(
            /([a-zA-Z])(E2[0-9A-Fa-f]{2})([a-zA-Z])/g,
            "$1=$2=$3",
        );

        // Step 4: Also handle cases where only one = is missing
        // Pattern: =XXYY (with =) or XX=YY (with = in middle)
        decoded = decoded.replace(
            /([a-zA-Z])=([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([a-zA-Z])/g,
            (_, before, hex1, hex2, after) => `${before}=${hex1}=${hex2}${after}`,
        );

        // Step 5: Decode =XX hex sequences
        decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });

        // Step 6: Handle UTF-8 multi-byte sequences
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
        }

        return new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
        // Best effort fallback
        return input
            .replace(/=\r?\n/g, "")
            .replace(/=(?=[a-zA-Z])/g, "")
            .replace(/C3=([0-9A-Fa-f]{2})/g, "=$1");
    }
}

/**
 * Decodes mail subject headers which may be encoded in various formats:
 * - =?UTF-8?Q?...?=
 * - =?UTF-8?B?...?=
 * - Raw Quoted-Printable
 */
export function decodeMailHeader(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    // Decode RFC 2047 encoded words: =?charset?encoding?encoded-text?=
    const rfc2047Pattern = /=\?([^?]+)\?([QB])\?([^?]+)\?=/gi;

    let decoded = input.replace(rfc2047Pattern, (match, charset, encoding, text) => {
        const normalizedCharset = charset.toLowerCase().replace(/[_-]/g, "");

        try {
            if (encoding.toUpperCase() === "Q") {
                // Quoted-Printable encoding
                const qpDecoded = text
                    .replace(/_/g, " ") // _ represents space in header QP
                    .replace(/=([0-9A-Fa-f]{2})/g, (_match: string, hex: string) => {
                        return String.fromCharCode(parseInt(hex, 16));
                    });

                // Convert to bytes then decode as UTF-8
                const bytes = new Uint8Array(qpDecoded.length);
                for (let i = 0; i < qpDecoded.length; i++) {
                    bytes[i] = qpDecoded.charCodeAt(i);
                }
                return new TextDecoder(normalizedCharset === "utf8" ? "utf-8" : normalizedCharset).decode(bytes);
            } else if (encoding.toUpperCase() === "B") {
                // Base64 encoding
                const binary = atob(text.replace(/\s/g, ""));
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return new TextDecoder(normalizedCharset === "utf8" ? "utf-8" : normalizedCharset).decode(bytes);
            }
        } catch {
            // If decoding fails, return original match
        }
        return match;
    });

    // Also try to decode raw QP content (for body text)
    if (decoded.includes("=") || /[0-9A-Fa-f]{4}/.test(decoded)) {
        decoded = decodeQuotedPrintable(decoded);
    }

    return decoded;
}
