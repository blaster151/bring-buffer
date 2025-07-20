import { describe, it, expect, beforeEach } from 'vitest'
import { RingBuffer } from './index'

describe('RingBuffer', () => {
  describe('Constructor', () => {
    it('should create buffer with default policies', () => {
      const buffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite'
      })
      
      expect(buffer).toBeInstanceOf(RingBuffer)
    })

    it('should create buffer with custom policies', () => {
      const buffer = new RingBuffer({
        capacity: 10,
        fullPolicy: 'throw',
        allocPolicy: 'grow',
        readPolicy: 'lifo'
      })
      
      expect(buffer).toBeInstanceOf(RingBuffer)
    })
  })

  describe('FullPolicy - overwrite', () => {
    let buffer: RingBuffer<number>

    beforeEach(() => {
      buffer = new RingBuffer({
        capacity: 3,
        fullPolicy: 'overwrite'
      })
    })

    it('should overwrite oldest item when full', () => {
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // Should overwrite 1

      const items = buffer.get()
      expect(items).toEqual([2, 3, 4])
    })

    it('should maintain correct order after overwrite', () => {
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)
      buffer.push(5) // Should overwrite 2

      const items = buffer.get()
      expect(items).toEqual([3, 4, 5])
    })
  })

  describe('FullPolicy - throw', () => {
    let buffer: RingBuffer<number>

    beforeEach(() => {
      buffer = new RingBuffer({
        capacity: 2,
        fullPolicy: 'throw'
      })
    })

    it('should throw error when buffer is full', () => {
      buffer.push(1)
      buffer.push(2)
      
      expect(() => buffer.push(3)).toThrow('RingBuffer is full')
    })

    it('should not throw when buffer has space', () => {
      buffer.push(1)
      expect(() => buffer.push(2)).not.toThrow()
    })
  })

  describe('FullPolicy - drop', () => {
    let buffer: RingBuffer<number>

    beforeEach(() => {
      buffer = new RingBuffer({
        capacity: 2,
        fullPolicy: 'drop'
      })
    })

    it('should silently drop items when full', () => {
      buffer.push(1)
      buffer.push(2)
      buffer.push(3) // Should be dropped

      const items = buffer.get()
      expect(items).toEqual([1, 2])
    })
  })

  describe('FullPolicy - resize', () => {
    let buffer: RingBuffer<number>

    beforeEach(() => {
      buffer = new RingBuffer({
        capacity: 2,
        fullPolicy: 'resize',
        allocPolicy: 'grow'
      })
    })

    it('should resize when full', () => {
      buffer.push(1)
      buffer.push(2)
      buffer.push(3) // Should trigger resize

      const items = buffer.get()
      expect(items).toEqual([1, 2, 3])
    })

    it('should throw error with fixed allocation policy', () => {
      const fixedBuffer = new RingBuffer({
        capacity: 2,
        fullPolicy: 'resize',
        allocPolicy: 'fixed'
      })

      fixedBuffer.push(1)
      fixedBuffer.push(2)
      
      expect(() => fixedBuffer.push(3)).toThrow('Cannot resize with fixed allocation policy')
    })
  })

  describe('AllocPolicy', () => {
    it('should use lazy allocation strategy', () => {
      const buffer = new RingBuffer({
        capacity: 3,
        fullPolicy: 'resize',
        allocPolicy: 'lazy'
      })

      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // Should add 3 more capacity (total 6)

      const items = buffer.get()
      expect(items).toEqual([1, 2, 3, 4])
    })

    it('should use aggressive allocation strategy', () => {
      const buffer = new RingBuffer({
        capacity: 2,
        fullPolicy: 'resize',
        allocPolicy: 'aggressive'
      })

      buffer.push(1)
      buffer.push(2)
      buffer.push(3) // Should quadruple size (total 8)

      const items = buffer.get()
      expect(items).toEqual([1, 2, 3])
    })
  })

  describe('ReadPolicy', () => {
    let buffer: RingBuffer<number>

    beforeEach(() => {
      buffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite'
      })
    })

    it('should return FIFO order by default', () => {
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      const items = buffer.get()
      expect(items).toEqual([1, 2, 3])
    })

    it('should return LIFO order', () => {
      const lifoBuffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite',
        readPolicy: 'lifo'
      })

      lifoBuffer.push(1)
      lifoBuffer.push(2)
      lifoBuffer.push(3)

      const items = lifoBuffer.get()
      expect(items).toEqual([3, 2, 1])
    })

    it('should return random order', () => {
      const randomBuffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite',
        readPolicy: 'random'
      })

      randomBuffer.push(1)
      randomBuffer.push(2)
      randomBuffer.push(3)

      const items = randomBuffer.get()
      expect(items).toHaveLength(3)
      expect(items).toContain(1)
      expect(items).toContain(2)
      expect(items).toContain(3)
    })

    it('should return priority order', () => {
      const priorityBuffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite',
        readPolicy: 'priority'
      })

      priorityBuffer.push(3)
      priorityBuffer.push(1)
      priorityBuffer.push(2)

      const items = priorityBuffer.get()
      expect(items).toEqual([1, 2, 3])
    })

    it('should return weighted order', () => {
      const weightedBuffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite',
        readPolicy: 'weighted'
      })

      weightedBuffer.push(1)
      weightedBuffer.push(3)
      weightedBuffer.push(2)

      const items = weightedBuffer.get()
      expect(items).toEqual([3, 2, 1])
    })

    it('should return batch items', () => {
      const batchBuffer = new RingBuffer({
        capacity: 10,
        fullPolicy: 'overwrite',
        readPolicy: 'batch'
      })

      for (let i = 1; i <= 15; i++) {
        batchBuffer.push(i)
      }

      const items = batchBuffer.get()
      expect(items).toHaveLength(10) // Default batch size
      expect(items[0]).toBeGreaterThan(5) // Should contain newer items
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty buffer', () => {
      const buffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite'
      })

      const items = buffer.get()
      expect(items).toEqual([])
    })

    it('should handle single item', () => {
      const buffer = new RingBuffer({
        capacity: 5,
        fullPolicy: 'overwrite'
      })

      buffer.push(42)
      const items = buffer.get()
      expect(items).toEqual([42])
    })

    it('should handle capacity of 1', () => {
      const buffer = new RingBuffer({
        capacity: 1,
        fullPolicy: 'overwrite'
      })

      buffer.push(1)
      buffer.push(2)

      const items = buffer.get()
      expect(items).toEqual([2])
    })
  })

  describe('String Data', () => {
    it('should handle string data correctly', () => {
      const buffer = new RingBuffer({
        capacity: 3,
        fullPolicy: 'overwrite'
      })

      buffer.push('hello')
      buffer.push('world')
      buffer.push('test')

      const items = buffer.get()
      expect(items).toEqual(['hello', 'world', 'test'])
    })
  })

  describe('Object Data', () => {
    it('should handle object data with timebased policy', () => {
      const buffer = new RingBuffer({
        capacity: 3,
        fullPolicy: 'overwrite',
        readPolicy: 'timebased'
      })

      buffer.push({ id: 1, timestamp: 100 })
      buffer.push({ id: 2, timestamp: 50 })
      buffer.push({ id: 3, timestamp: 200 })

      const items = buffer.get()
      expect(items[0].timestamp).toBe(50) // Oldest first
      expect(items[2].timestamp).toBe(200) // Newest last
    })
  })
}) 