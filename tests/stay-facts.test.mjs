import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFactRows, safeSourceUrl, STAY_FIELDS } from "../assets/js/stay-facts.js";

const postUrl = "https://atlas.example/oakwood/";
const fact = (key, value, overrides = {}) => ({ key, value, note: "", validCells: true, sources: [], ...overrides });

test("comparison reads stable keys and keeps unknowns separate from no", () => {
    const result = normalizeFactRows([
        fact("name", " Oakwood  Apartments "),
        fact("kitchen", "Нет"),
        fact("price", ""),
    ], postUrl);
    assert.equal(result.status, "ready");
    assert.equal(result.fields.name.value, "Oakwood Apartments");
    assert.equal(result.fields.kitchen.value, "Нет");
    assert.equal(result.fields.price.value, "Не уточнено");
    assert.equal(result.fields.price.missing, false);
    assert.equal(result.fields.pool.missing, true);
    assert.match(result.fields.pool.note, /не заполнено/);
    assert.equal(Object.keys(result.fields).length, STAY_FIELDS.length);
});

test("duplicate fields and damaged rows are visible format errors", () => {
    assert.equal(normalizeFactRows([fact("kitchen", "Да"), fact("kitchen", "Нет")], postUrl).status, "malformed");
    assert.equal(normalizeFactRows([fact("kitchen", "Да", { validCells: false })], postUrl).status, "malformed");
    assert.equal(normalizeFactRows([], postUrl).status, "malformed");
});

test("unknown keys never become properties or override known fields", () => {
    const result = normalizeFactRows([fact("__proto__", "unsafe"), fact("name", "Example"), fact("cuisine", "Да")], postUrl);
    assert.equal(result.status, "ready");
    assert.equal(result.fields.kitchen.value, "Не уточнено");
    assert.equal(Object.hasOwn(result.fields, "__proto__"), false);
    assert.ok(result.warnings.some((warning) => warning.includes("cuisine")));
});

test("sources preserve labels, resolve relative links, and deduplicate", () => {
    const result = normalizeFactRows([fact("kitchen", "Да", {
        note: " Уточнить  категорию номера. ",
        sources: [
            { href: "/source/", label: "Описание оператора" },
            { href: "https://atlas.example/source/", label: "Повтор" },
            { href: "javascript:alert(1)", label: "Unsafe" },
            { href: "https://hotel.example/", label: "" },
        ],
    })], postUrl);
    assert.equal(result.fields.kitchen.note, "Уточнить категорию номера.");
    assert.deepEqual(result.fields.kitchen.sources, [
        { href: "https://atlas.example/source/", label: "Описание оператора" },
        { href: "https://hotel.example/", label: "hotel.example" },
    ]);
});

test("source links allow only HTTP(S) and do not expose URL credentials", () => {
    for (const href of ["", "javascript:alert(1)", "data:text/html,test", "file:///secret", "mailto:owner@example.com", "https://user:password@example.com/"]) {
        assert.equal(safeSourceUrl(href, postUrl), null);
    }
    assert.equal(safeSourceUrl("http://hotel.example/page", postUrl), "http://hotel.example/page");
});
