/**
 * Decodes Quoted-Printable encoded text to UTF-8 string.
 * Handles common mail encoding issues like:
 * - r=C3=BCckg=C3=A4ngig -> rückgängig
 * - =C3=9Cbersicht -> Übersicht
 */
export function decodeQuotedPrintable(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    // Check if input contains QP sequences
    if (!input.includes("=")) {
        return input;
    }

    try {
        // Remove soft line breaks (= followed by \r\n or \n)
        let decoded = input.replace(/=\r?\n/g, "");

        // Decode =XX hex sequences
        decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });

        // Handle UTF-8 multi-byte sequences
        // The above creates a "binary" string that needs proper UTF-8 decoding
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
        }

        return new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
        // If decoding fails, return original with soft breaks removed
        return input.replace(/=\r?\n/g, "");
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
    if (decoded.includes("=")) {
        decoded = decodeQuotedPrintable(decoded);
    }

    return decoded;
}
