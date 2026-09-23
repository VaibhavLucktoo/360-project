import test from "node:test";
import assert from "node:assert/strict";
import { removeLeadingWhitespace, removeWhitespace, normalizeUserInput } from "../src/utils/inputWhitespace.js";

test("spaces, tabs and newlines cannot be the first input", () => {
    for (const whitespace of [" ", "   ", "\t", "\n", "\u00a0", "\u2003"]) {
        assert.equal(removeLeadingWhitespace(whitespace), "");
        assert.equal(removeLeadingWhitespace(whitespace + "Team"), "Team");
    }
});
test("typing a phrase keeps spaces between words and the space before the next word", () => {
    let value = "";
    for (const character of "  Survey Coordinator ") value = removeLeadingWhitespace(value + character);
    assert.equal(value, "Survey Coordinator ");
});
test("pasted multi-line descriptions keep their internal formatting", () => {
    assert.equal(removeLeadingWhitespace(" \n\tFirst line\n  Second line"), "First line\n  Second line");
});
test("email, password and employee ID strip whitespace anywhere", () => {
    for (const field of ["email", "password", "employee_id"]) {
        assert.equal(normalizeUserInput(field, " \tA B\nC\u00a0 "), "ABC");
    }
    assert.equal(removeWhitespace(" person @ example.com "), "person@example.com");
});
test("names and departments allow spaces between words", () => {
    for (const field of ["full_name", "department"]) {
        assert.equal(normalizeUserInput(field, "  Human Resources "), "Human Resources ");
    }
});
test("removing the first word cannot leave leading spaces behind", () => {
    assert.equal(removeLeadingWhitespace(" Coordinator"), "Coordinator");
    assert.equal(removeLeadingWhitespace(""), "");
});
