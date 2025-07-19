/**
 * Main entry point for the bring-buffer library
 */

type FullPolicy = 'overwrite' | 'throw' | 'block' | 'drop' | 'resize';
type AllocPolicy = 'fixed' | 'grow' | 'shrink' | 'lazy' | 'aggressive' | 'adaptive';
type ReadPolicy = 'fifo' | 'lifo' | 'random' | 'priority' | 'weighted' | 'timebased' | 'batch';

interface RingBufferOptions {
  capacity: number;
  fullPolicy: FullPolicy;
  allocPolicy?: AllocPolicy;
  readPolicy?: ReadPolicy;
}

class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private full = false;
  private fullPolicy: FullPolicy;
  private allocPolicy: AllocPolicy;
  private readPolicy: ReadPolicy;
  private capacity: number;

  constructor(options: RingBufferOptions) {
    this.capacity = options.capacity;
    this.buffer = new Array(this.capacity);
    this.fullPolicy = options.fullPolicy;
    this.allocPolicy = options.allocPolicy || 'fixed';
    this.readPolicy = options.readPolicy || 'fifo';
  }

  private isFull(): boolean {
    return this.full;
  }

  push(item: T): void {
    if (this.isFull()) {
      switch (this.fullPolicy) {
        case 'overwrite':
          this.buffer[this.head] = item;
          this.head = (this.head + 1) % this.capacity;
          this.tail = this.head;
          return;

        case 'throw':
          throw new Error("RingBuffer is full");

        case 'drop':
          return;

        case 'resize':
          if (this.allocPolicy === 'fixed') {
            throw new Error("Cannot resize with fixed allocation policy");
          }
          this._resize();
          break;

        // optionally: block until space available
      }
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.tail === this.head) this.full = true;
  }

  private _resize(): void {
    let newSize: number;
    
    switch (this.allocPolicy) {
      case 'fixed':
        throw new Error("Cannot resize with fixed allocation policy");
      case 'grow':
        newSize = this.buffer.length * 2;
        break;
      case 'shrink':
        newSize = Math.max(this.capacity, this.buffer.length / 2);
        break;
      case 'lazy':
        newSize = this.buffer.length + this.capacity; // Add original capacity
        break;
      case 'aggressive':
        newSize = this.buffer.length * 4; // Quadruple size
        break;
      case 'adaptive':
        // Adaptive: grow faster when more full, slower when less full
        const fullness = this._getItemCount() / this.buffer.length;
        newSize = this.buffer.length * (1 + fullness);
        break;
      default:
        newSize = this.buffer.length * 2;
    }

    const newBuffer = new Array(Math.ceil(newSize));
    const items = this._getFifo(); // Use FIFO to preserve order during resize
    this.buffer = newBuffer;
    this.head = 0;
    this.tail = items.length;
    this.full = false;
    for (let i = 0; i < items.length; i++) {
      this.buffer[i] = items[i];
    }
  }

  private _getItemCount(): number {
    if (this.full) return this.buffer.length;
    return (this.tail - this.head + this.buffer.length) % this.buffer.length;
  }

  get(): T[] {
    switch (this.readPolicy) {
      case 'fifo':
        return this._getFifo();
      case 'lifo':
        return this._getLifo();
      case 'random':
        return this._getRandom();
      case 'priority':
        return this._getPriority();
      case 'weighted':
        return this._getWeighted();
      case 'timebased':
        return this._getTimebased();
      case 'batch':
        return this._getBatch();
      default:
        return this._getFifo();
    }
  }

  private _getFifo(): T[] {
    const items: T[] = [];
    let i = this.head;
    const end = this.full ? this.tail + this.buffer.length : this.tail;
    for (; i < end; i++) {
      items.push(this.buffer[i % this.buffer.length]!);
    }
    return items;
  }

  private _getLifo(): T[] {
    const items: T[] = [];
    let i = this.tail - 1;
    const start = this.full ? this.head - 1 : -1;
    for (; i > start; i--) {
      const index = i < 0 ? i + this.buffer.length : i;
      items.push(this.buffer[index]!);
    }
    return items;
  }

  private _getRandom(): T[] {
    const items = this._getFifo();
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  private _getPriority(): T[] {
    // Simple priority implementation - assumes items are comparable
    const items = this._getFifo();
    return items.sort();
  }

  private _getWeighted(): T[] {
    // Weighted: items with higher values get higher priority
    const items = this._getFifo();
    return items.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return b - a; // Higher numbers first
      }
      return 0; // Fallback to original order
    });
  }

  private _getTimebased(): T[] {
    // Time-based: assumes items have timestamp or age property
    const items = this._getFifo();
    return items.sort((a, b) => {
      const aTime = (a as any).timestamp || (a as any).age || 0;
      const bTime = (b as any).timestamp || (b as any).age || 0;
      return aTime - bTime; // Oldest first
    });
  }

  private _getBatch(): T[] {
    // Batch: return items in chunks, useful for processing
    const items = this._getFifo();
    const batchSize = Math.min(10, items.length); // Default batch size
    return items.slice(0, batchSize);
  }
}

// Export your library functionality here
export const version = '1.0.0';

// Default export
export default {
  version
}; 