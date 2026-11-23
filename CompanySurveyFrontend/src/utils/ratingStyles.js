/**
 * Utility for parsing and formatting rating question display styles.
 * Supported styles: 'stars' (default), 'emojis', 'numeric'
 */

export function parseRatingQuestion(questionText) {
    if (!questionText || typeof questionText !== "string") {
        return { cleanText: "", ratingStyle: "stars" };
    }

    const match = questionText.match(/\[style:(stars|emojis|numeric)\]/i);
    if (match) {
        return {
            cleanText: questionText
                .replace(/\[style:(stars|emojis|numeric)\]/gi, "")
                .trim(),
            ratingStyle: match[1].toLowerCase(),
        };
    }

    return {
        cleanText: questionText.trim(),
        ratingStyle: "stars",
    };
}

export function formatRatingQuestion(cleanText, ratingStyle) {
    const trimmed = (cleanText || "").trim();
    const style = (ratingStyle || "stars").toLowerCase();
    return `${trimmed} [style:${style}]`;
}

