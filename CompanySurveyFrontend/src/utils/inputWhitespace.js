// Normalize the complete value so typing, pasting, and autofill follow the same rule.
export function removeLeadingWhitespace(value) {
    return value.trimStart();
}

export function removeWhitespace(value) {
    return value.replace(/\s/gu, "");
}

export function normalizeUserInput(field, value) {
    return ["employee_id", "email", "password"].includes(field)
        ? removeWhitespace(value)
        : removeLeadingWhitespace(value);
}
