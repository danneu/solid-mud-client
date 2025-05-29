import { test } from "node:test";
import assert from "node:assert";
import {
  createRingBuffer,
  push,
  toArray,
  length,
  isEmpty,
  isFull,
  clear,
  peek,
  peekLast,
} from "../src/util/RingBuffer.ts";

test("createRingBuffer creates empty buffer", () => {
  const buffer = createRingBuffer<number>(5);
  assert.strictEqual(length(buffer), 0);
  assert.ok(isEmpty(buffer));
  assert.ok(!isFull(buffer));
});

test("push adds items to buffer", () => {
  const buffer = createRingBuffer<number>(3);
  push(buffer, 1, 2);

  assert.strictEqual(length(buffer), 2);
  assert.deepStrictEqual(toArray(buffer), [1, 2]);
});

test("buffer overwrites oldest when full", () => {
  const buffer = createRingBuffer<number>(3);
  push(buffer, 1, 2, 3, 4, 5);

  assert.strictEqual(length(buffer), 3);
  assert.ok(isFull(buffer));
  assert.deepStrictEqual(toArray(buffer), [3, 4, 5]);
});

test("peek returns first item", () => {
  const buffer = createRingBuffer<number>(3);
  push(buffer, 1, 2, 3);

  assert.strictEqual(peek(buffer), 1);
  assert.strictEqual(length(buffer), 3); // Should not modify buffer
});

test("peekLast returns last item", () => {
  const buffer = createRingBuffer<number>(3);
  push(buffer, 1, 2, 3);

  assert.strictEqual(peekLast(buffer), 3);
  assert.strictEqual(length(buffer), 3); // Should not modify buffer
});

test("clear empties buffer", () => {
  const buffer = createRingBuffer<number>(3);
  push(buffer, 1, 2, 3);
  clear(buffer);

  assert.strictEqual(length(buffer), 0);
  assert.ok(isEmpty(buffer));
  assert.deepStrictEqual(toArray(buffer), []);
});

test("peek on empty buffer returns undefined", () => {
  const buffer = createRingBuffer<number>(3);

  assert.strictEqual(peek(buffer), undefined);
  assert.strictEqual(peekLast(buffer), undefined);
});

test("buffer handles wrap-around correctly", () => {
  const buffer = createRingBuffer<string>(4);
  push(buffer, "a", "b", "c", "d");
  assert.deepStrictEqual(toArray(buffer), ["a", "b", "c", "d"]);

  push(buffer, "e");
  assert.deepStrictEqual(toArray(buffer), ["b", "c", "d", "e"]);

  push(buffer, "f", "g");
  assert.deepStrictEqual(toArray(buffer), ["d", "e", "f", "g"]);
});
