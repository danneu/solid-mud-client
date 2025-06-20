import { test } from "vitest";
import assert from "node:assert/strict";
import { AliasMatcher } from "../src/alias.ts";

test("Valid patterns should succeed", () => {
  const cases: { aliases: Record<string, string>; description: string }[] = [
    { aliases: { f: "feed self" }, description: "simple alias" },
    { aliases: { n: "north" }, description: "direction alias" },
    { aliases: { "c *": "cast $1" }, description: "single wildcard" },
    {
      aliases: { "foo * bar *": "foo $1 bar $2" },
      description: "multiple wildcards",
    },
    { aliases: { "h*": "help $1" }, description: "prefix wildcard" },
    {
      aliases: { "t* *": "tell $1 $2" },
      description: "prefix wildcard with space",
    },
  ];

  for (const { aliases, description } of cases) {
    const result = AliasMatcher.compileSafe(aliases);
    assert.equal(result.success, true, `${description} should succeed`);
  }
});

test("Invalid patterns should fail", () => {
  const cases: { aliases: Record<string, string>; expectedError: string }[] = [
    {
      aliases: { "*": "invalid" },
      expectedError:
        "Pattern must start with at least one character (not a wildcard)",
    },
    {
      aliases: { "* hello": "invalid" },
      expectedError:
        "Pattern must start with at least one character (not a wildcard)",
    },
    {
      aliases: { "  *  ": "invalid" },
      expectedError:
        "Pattern must start with at least one character (not a wildcard)",
    },
    {
      aliases: { "": "invalid" },
      expectedError: "Pattern cannot be empty",
    },
    {
      aliases: { "   ": "invalid" },
      expectedError: "Pattern cannot be empty",
    },
  ];

  for (const { aliases, expectedError } of cases) {
    const result = AliasMatcher.compileSafe(aliases);
    assert.equal(
      result.success,
      false,
      `Pattern "${Object.keys(aliases)[0]}" should fail`,
    );
    if (!result.success) {
      assert.equal(result.errors.length, 1);
      assert.equal(result.errors[0].message, expectedError);
    }
  }
});

test("Mixed valid/invalid patterns should fail with all errors", () => {
  const result = AliasMatcher.compileSafe({
    f: "feed self",
    "*": "invalid",
    "* bar": "invalid2",
    "h *": "heal $1",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.length, 2);

    const errorPatterns = result.errors.map((e) => e.pattern);
    assert.ok(errorPatterns.includes("*"));
    assert.ok(errorPatterns.includes("* bar"));

    for (const error of result.errors) {
      assert.equal(
        error.message,
        "Pattern must start with at least one character (not a wildcard)",
      );
    }
  }
});

test("Matching should work correctly", () => {
  const result = AliasMatcher.compileSafe({
    f: "feed self",
    n: "north",
    "c *": "cast $1",
    "tell * *": "tell $1 $2",
    "foo * bar *": "foo $1 bar $2 baz",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    // Test simple aliases
    let match = alias.match("f");
    assert.ok(match);
    assert.deepEqual(match.output, ["feed self"]);
    assert.deepEqual(match.params, []);

    match = alias.match("n");
    assert.ok(match);
    assert.deepEqual(match.output, ["north"]);

    // Test single wildcard
    match = alias.match("c fireball");
    assert.ok(match);
    assert.deepEqual(match.output, ["cast fireball"]);
    assert.deepEqual(match.params, ["fireball"]);

    // Test multiple wildcards
    match = alias.match("tell alice hello");
    assert.ok(match);
    assert.deepEqual(match.output, ["tell alice hello"]);
    assert.deepEqual(match.params, ["alice", "hello"]);

    match = alias.match("foo test bar value");
    assert.ok(match);
    assert.deepEqual(match.output, ["foo test bar value baz"]);
    assert.deepEqual(match.params, ["test", "value"]);

    // Test non-matching
    assert.equal(alias.match("x"), null);
    assert.equal(alias.match(""), null);
  }
});

test("Patterns with prefix wildcards should work", () => {
  const result = AliasMatcher.compileSafe({
    "h*": "help $1",
    "t* *": "tell $1 $2",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    let match = alias.match("hello");
    assert.ok(match);
    assert.deepEqual(match.output, ["help ello"]);
    assert.deepEqual(match.params, ["ello"]);

    match = alias.match("talice message");
    assert.ok(match);
    assert.deepEqual(match.output, ["tell alice message"]);
    assert.deepEqual(match.params, ["alice", "message"]);
  }
});

test("Pattern specificity ordering should work", () => {
  const result = AliasMatcher.compileSafe({
    "c *": "generic cast $1",
    "c fire": "cast fireball",
    "c * *": "cast $1 at $2",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    // Most specific match (no wildcards)
    let match = alias.match("c fire");
    assert.ok(match);
    assert.deepEqual(match.output, ["cast fireball"]);

    // One wildcard match
    match = alias.match("c ice");
    assert.ok(match);
    assert.deepEqual(match.output, ["generic cast ice"]);

    // Two wildcard match - but since "c *" has fewer wildcards, it matches first
    match = alias.match("c fire monster");
    assert.ok(match);
    assert.deepEqual(match.output, ["generic cast fire monster"]);
  }
});

test("listPatterns should return all patterns", () => {
  const patterns = {
    f: "feed self",
    n: "north",
    "c *": "cast $1",
  };

  const result = AliasMatcher.compileSafe(patterns);
  assert.equal(result.success, true);
  if (result.success) {
    const listed = result.alias.listPatterns();
    assert.equal(listed.length, 3);
    for (const pattern of Object.keys(patterns)) {
      assert.ok(listed.includes(pattern));
    }
  }
});

test("Pattern matching should handle multiple spaces correctly", () => {
  const result = AliasMatcher.compileSafe({
    "say *": "say $1",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    let match = alias.match("say hello world");
    assert.ok(match);
    assert.deepEqual(match.output, ["say hello world"]);
    assert.deepEqual(match.params, ["hello world"]);
  }
});

test("Pattern matching should handle regex special characters", () => {
  const result = AliasMatcher.compileSafe({
    "test.": "test dot",
    "test+": "test plus",
    "test?": "test question",
    "test[": "test bracket",
    "test^": "test caret",
    test$: "test dollar",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    assert.deepEqual(alias.match("test.")?.output, ["test dot"]);
    assert.deepEqual(alias.match("test+")?.output, ["test plus"]);
    assert.deepEqual(alias.match("test?")?.output, ["test question"]);
    assert.deepEqual(alias.match("test[")?.output, ["test bracket"]);
    assert.deepEqual(alias.match("test^")?.output, ["test caret"]);
    assert.deepEqual(alias.match("test$")?.output, ["test dollar"]);

    // Should not match with regex interpretation
    assert.equal(alias.match("testX"), null);
  }
});

test("Multiple parameter replacements should work", () => {
  const result = AliasMatcher.compileSafe({
    "swap * *": "$2 $1",
    "repeat *": "$1 $1 $1",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    let match = alias.match("swap hello world");
    assert.ok(match);
    assert.deepEqual(match.output, ["world hello"]);

    match = alias.match("repeat test");
    assert.ok(match);
    assert.deepEqual(match.output, ["test test test"]);
  }
});

test("Multiline output should be split into array", () => {
  const result = AliasMatcher.compileSafe({
    multi: "line1\nline2\nline3",
    "echo *": "You said: $1\nEcho: $1",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;

    let match = alias.match("multi");
    assert.ok(match);
    assert.deepEqual(match.output, ["line1", "line2", "line3"]);

    match = alias.match("echo hello");
    assert.ok(match);
    assert.deepEqual(match.output, ["You said: hello", "Echo: hello"]);
  }
});

test("whitespace spam gets compacted", () => {
  const result = AliasMatcher.compileSafe({
    foo: "\n  \n\na\n\nb\n\r\n \r\r  \n  \n c \n",
  });

  assert.equal(result.success, true);
  if (result.success) {
    const alias = result.alias;
    assert.deepEqual(alias.match("foo")?.output, ["a", "b", "c"]);
  }
});
