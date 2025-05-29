export type RingBuffer<T> = {
  buffer: T[];
  size: number;
  head: number;
  tail: number;
  count: number;
  // For debug
  toJSON: () => {
    buffer: T[];
  };
};

export function createRingBuffer<T>(
  size: number,
  items: T[] = [],
): RingBuffer<T> {
  const buf = {
    buffer: new Array(size),
    size,
    head: 0,
    tail: 0,
    count: 0,
    toJSON() {
      return {
        buffer: this.buffer.slice(this.head, this.tail),
      };
    },
  };

  push(buf, ...items);

  return buf;
}

export function push<T>(ringBuf: RingBuffer<T>, ...items: T[]): void {
  for (const item of items) {
    ringBuf.buffer[ringBuf.tail] = item;
    ringBuf.tail = (ringBuf.tail + 1) % ringBuf.size;

    if (ringBuf.count < ringBuf.size) {
      ringBuf.count++;
    } else {
      // Buffer is full, advance head to overwrite oldest
      ringBuf.head = (ringBuf.head + 1) % ringBuf.size;
    }
  }
}

export function toArray<T>(ringBuf: RingBuffer<T>): T[] {
  if (ringBuf.count === 0) {
    return [];
  }

  const result: T[] = [];
  let current = ringBuf.head;

  for (let i = 0; i < ringBuf.count; i++) {
    result.push(ringBuf.buffer[current]);
    current = (current + 1) % ringBuf.size;
  }

  return result;
}

export function length<T>(ringBuf: RingBuffer<T>): number {
  return ringBuf.count;
}

export function isEmpty<T>(ringBuf: RingBuffer<T>): boolean {
  return ringBuf.count === 0;
}

export function isFull<T>(ringBuf: RingBuffer<T>): boolean {
  return ringBuf.count === ringBuf.size;
}

export function clear<T>(ringBuf: RingBuffer<T>): void {
  ringBuf.head = 0;
  ringBuf.tail = 0;
  ringBuf.count = 0;
}

export function peek<T>(ringBuf: RingBuffer<T>): T | undefined {
  return ringBuf.count > 0 ? ringBuf.buffer[ringBuf.head] : undefined;
}

export function peekLast<T>(ringBuf: RingBuffer<T>): T | undefined {
  if (ringBuf.count === 0) {
    return undefined;
  }
  const lastIndex = (ringBuf.tail - 1 + ringBuf.size) % ringBuf.size;
  return ringBuf.buffer[lastIndex];
}
