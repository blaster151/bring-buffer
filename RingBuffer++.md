# RingBuffer++



## 1. **Overview / Introduction**

### What is RingBuffer++?

**RingBuffer++** is a flexible, extensible, policy-driven reimagining of the classic circular buffer. It preserves the core performance characteristics of a traditional ring buffer—bounded memory, constant-time operations, and efficient wrapping—while introducing a modular architecture that supports a wide range of use cases through configurable behavior.

Instead of forcing developers to choose between different implementations (e.g., overwriting vs. bounded), RingBuffer++ provides a unified interface with **pluggable policies** for how the buffer behaves when full, how it allocates memory, how it handles concurrent access, and how data is read or transformed. This allows a single codebase to support **network packet queues**, **log retention buffers**, **sensor data streams**, **low-latency audio effects**, and **disk-backed caches**—all with the same core.

RingBuffer++ is not just a circular buffer—it's a **buffering toolkit**, built for developers who want performance, predictability, and adaptability across domains.

### Why go beyond traditional ring buffers?

Traditional ring buffers are elegant, performant, and time-tested — but they're often **too rigid** for modern, diverse workloads. Most implementations lock into one behavior: overwrite when full, fixed memory allocation, single-threaded access, single-pointer semantics. That’s great for embedded systems or audio delay lines, but it **limits reusability and adaptability** in higher-level domains like concurrent systems, real-time analytics, or simulation.

**RingBuffer++** addresses this by embracing a **policy-driven design** that decouples structure from behavior. It allows developers to choose *how the buffer responds when full*, *how it allocates memory*, *how it handles concurrency*, and even *how values are interpolated or streamed*. This lets a single, well-tested core power use cases as varied as zero-copy networking, timestamped event logs, fractional-delay audio effects, and out-of-core disk-backed pipelines.

By supporting **toggleable full-buffer policies**, **vectorized layouts**, and **modular access models**, RingBuffer++ transforms the ring buffer from a low-level primitive into a **flexible foundation for high-performance, streaming-aware applications** across domains.

### Key use cases

Audio/DSP, networking, real-time queues, embedded systems, simulations, bitstream management

------

## 2. **Design Philosophy**

### Modular, pluggable behaviors

### Policy-driven configuration over subclass proliferation

In traditional OOP designs, adding new behavior often means creating new subclasses. For example, if you want a buffer that overwrites when full and another that throws when full, you might see:

```
tsCopyEditclass OverwritingRingBuffer extends RingBuffer { ... }
class BoundedRingBuffer extends RingBuffer { ... }
```

Do this a few more times—for allocation strategies, thread safety, or interpolation—and you end up with a **combinatorial explosion of subclasses**, each fragile, duplicated, and hard to test in isolation.

------

#### 🧩 **Policy-driven design solves this elegantly**

Instead of subclassing for each variation, you **encapsulate behaviors as modular "policies"**, passed into a single configurable class. Example:

```typescript
const buffer = new RingBuffer({
  capacity: 256,
  fullPolicy: 'overwrite',
  allocStrategy: 'lazy',
  concurrency: 'single'
});
```

Each policy is:

- **Orthogonal**: Changing the eviction policy doesn’t affect allocation strategy.
- **Composable**: You can mix and match any valid combination.
- **Mockable/Testable**: Policies can be injected, unit-tested, and replaced.
- **Extensible**: Users can define custom policies without touching core logic.

------

#### 🧠 Why it matters in RingBuffer++:

- It **centralizes complexity** into a few well-designed strategy modules instead of spreading it across many subclasses.
- It **lowers the barrier to contribution**, because users can add or extend behaviors without forking or rewriting core structures.
- It aligns with modern patterns (like dependency injection, functional composition, or mixins), giving it **a long shelf life**.

- Unified API for multiple buffer forms
- Favor zero-copy, bounded memory, and performance-awareness
- Interoperability with async, lock-free, and high-throughput pipelines

------

## 3. **Core Concepts**

### 3.1 The Base RingBuffer

#### Fixed-size, circular memory

At the heart of a ring buffer is its structural identity: a **preallocated, fixed-capacity array** whose indexing wraps around upon reaching the end—creating the illusion of **circular memory** atop a linear data structure. This design enables **constant-time insertion and removal**, predictable memory usage, and minimal allocation overhead.

Unlike dynamic structures such as linked lists or resizeable arrays, a ring buffer operates within a **bounded memory footprint**, making it highly suitable for real-time systems, embedded hardware, and streaming applications where latency, allocation jitter, or garbage collection are unacceptable.

The "circular" aspect is a logical property: as the `head` and `tail` pointers advance through the buffer, they wrap around to the beginning when they reach the end—typically via modular arithmetic (`index = (index + 1) % capacity`). This cyclical indexing allows the structure to efficiently reuse memory without shifting elements.

In RingBuffer++, this fundamental model remains central, but is enhanced through policy-driven customization. While the default assumes **fixed-size circular memory**, developers can opt into behaviors like lazy allocation, overflow resizing, or out-of-core backing stores—all without compromising the structural benefits of the core ring buffer design.

#### **Overwrite vs. Bounded Write Policies**

One of the most critical behavioral decisions in a ring buffer is how it handles **write attempts when full**. Classic ring buffers typically pick one of two stances:

------

##### **1. Overwrite Policy (Evict Oldest)**

- New writes **replace the oldest item** in the buffer when capacity is reached.
- Useful for:
  - **Telemetry/logging**: Keep only the most recent events.
  - **Audio DSP**: Continuous rolling buffer for delay effects.
  - **Real-time systems**: Never block or throw—latency takes precedence over completeness.
- Implementation: Move the `head` forward alongside the `tail`.

##### **2. Bounded Write Policy (Reject New)**

- New writes are **rejected** when the buffer is full.
- Buffer becomes **temporarily immutable** until space is freed.
- Useful for:
  - **Producer-consumer queues**: Avoid unintentional data loss.
  - **Batching systems**: Signal backpressure.
  - **Safety-critical applications**: Enforce data integrity.
- Implementation: Throw an error, return `false`, or (in async systems) block.

------

##### In RingBuffer++:

These become **pluggable full-policy behaviors**, not hardcoded decisions:

```typescript
new RingBuffer({
  capacity: 1024,
  fullPolicy: 'overwrite' | 'throw' | 'drop' | 'block'
});
```

This flexibility allows a single buffer implementation to serve diverse needs without duplicating code or forcing developers into subclassing for what should be a simple, declarative toggle.

By separating **write policy** from core structure, RingBuffer++ lets developers express intent clearly—**"keep the freshest data"** vs. **"fail fast on overflow"**—while still benefiting from the same performant, circular core.

#### Indexing and wrap-around behavior

At the heart of any ring buffer lies its distinctive **wrap-around indexing model**, which allows it to simulate an infinite queue using a **fixed-size array**. Rather than shifting data or resizing storage, a ring buffer simply uses **two moving pointers**—commonly called `head` and `tail`—to track where elements are read from and written to. When either pointer reaches the end of the underlying array, it **wraps back to the beginning** using modular arithmetic.

##### Basic indexing behavior:

```typescript
nextIndex = (currentIndex + 1) % capacity;
```

This **circular traversal** creates the illusion of a ring-shaped memory space and enables:

- **Constant-time appends and removals**
- **Efficient memory reuse** without shifting data
- **Stable, cache-friendly layouts** ideal for low-latency systems

##### Pointer semantics:

- **Head**: The position of the next item to be read (or overwritten if in `overwrite` mode).
- **Tail**: The position where the next item will be written.
- **Full/empty detection**: Implementations often track a size counter or use reserved slots to disambiguate between full and empty states when `head === tail`.

##### In RingBuffer++:

RingBuffer++ retains this classic model but exposes it as a **configurable and extensible behavior**:

- Default wrap-around via modulo arithmetic.
- Option to access raw `head`, `tail`, or `logical index` for advanced consumers.
- Support for **fractional indexing** in variants like `FractionalDelayBuffer`, enabling interpolated reads.
- Potential for alternate layouts (e.g., strided or time-aligned) via a pluggable `indexPolicy`.

This wrapping index model is what gives the ring buffer its name, and it remains foundational to all variants in RingBuffer++. Rather than abstracting it away, RingBuffer++ makes it visible, customizable, and robust—**a strength, not a constraint.**

### 3.2 Buffer Policies

#### FullPolicy: `overwrite`, `throw`, `block`

The `FullPolicy` defines how the buffer behaves when a write is attempted on a **full buffer**—a central decision point in ring buffer semantics. RingBuffer++ makes this behavior explicit and configurable, avoiding one-size-fits-all assumptions.

------

##### 🔁 `overwrite`

- **Description**: When full, the **oldest item is discarded** to make room for the new one.
- **Use Cases**:
  - Real-time telemetry or logs where **latest data matters more than completeness**
  - Audio and video streaming buffers
- **Behavior**:
  - Advance both `head` and `tail`
  - Guarantees write success, but drops history

------

##### ⛔ `throw`

- **Description**: Rejects new writes when full by **throwing an exception** or returning an error.
- **Use Cases**:
  - Bounded queues where **data loss is unacceptable**
  - Systems that use **backpressure or retry**
- **Behavior**:
  - Leaves buffer unchanged
  - Signals the caller explicitly

------

##### ⏳ `block` *(optional / async contexts)*

- **Description**: In an async or multi-threaded context, the writer will **wait until space becomes available**.
- **Use Cases**:
  - Producer-consumer pipelines
  - Rate-limited streaming or thread-safe job queues
- **Behavior**:
  - Uses locks, condition variables, or promises
  - Requires cooperative consumers to drain the buffer

##### 🧩 In RingBuffer++:

Rather than baking in just one behavior, RingBuffer++ exposes `FullPolicy` as a **configurable enum or strategy** at construction:

```typescript
new RingBuffer<T>({
  capacity: 256,
  fullPolicy: 'overwrite' | 'throw' | 'block'
});
```

By decoupling full-buffer behavior from core logic, RingBuffer++ lets developers select the semantic contract that best matches their system's requirements—**whether it's fail-fast, loss-tolerant, or synchronously coordinated**.

This policy-based design enables clear intent, better reuse, and easier testing—because when the buffer is full, how it responds should be a choice, not an assumption.





- AllocationStrategy: `eager`, `lazy`, `paged`
- Concurrency: `single-threaded`, `lock-based`, `lock-free`
- AccessModel: `standard`, `interpolated`, `fractional`

------

## 4. **API Overview**

- Constructor signature with config options
- Core methods: `push`, `pop`, `peek`, `get`, `clear`, `toArray`
- Optional methods: `getInterpolated`, `reserve`, `lock`
- Iteration protocol (`[Symbol.iterator]`)
- TypeScript support and generics

------

## 5. **Variant Structures (Extensions)**

### 5.1 `BipBuffer<T>`

- Use case: Zero-copy network streaming
- Reserved writes, contiguous allocation
- Comparison to base RingBuffer

### 5.2 `PingPongBuffer<T>`

- Use case: Staged processing pipelines
- Double-buffered write/read alternation
- Flush/swap semantics

### 5.3 `FractionalDelayBuffer<T>`

- Use case: Audio effects and simulations
- Fractional read/write pointer
- Interpolation methods (linear, cubic)

### 5.4 `CircularBuffer3D<T>`

- Use case: Multi-axis signal data (e.g., time x channel x frame)
- Multi-dimensional indexing
- Layout-aware reads

### 5.5 `OutOfCoreBuffer<T>`

- Use case: Memory-constrained environments
- Swaps to IndexedDB, localStorage, or disk
- Async access + paging

------

## 6. **Composable Streaming Architecture**

- Vector of ring buffers (sharded workloads)
- Buffer chains (e.g., output of A feeds input of B)
- Rate matchers and flow control policies
- Integration with `ReadableStream`/`WritableStream` (if web)

------

## 7. **Safety and Performance Features**

- Type safety (TypeScript generics)
- Safe indexing, wrap protection
- Zero-copy patterns
- Thread-safe wrappers (if relevant)
- Benchmarks vs. baseline ring buffers

------

## 8. **Example Use Cases**

- Audio delay effect (FractionalDelayBuffer)
- Real-time data logger (RingBuffer with `overwrite`)
- Producer-consumer queue (Synchronized buffer)
- Double-buffered animation frames (PingPongBuffer)
- Packet IO (BipBuffer with `reserve()` semantics)
- Rate-matching in encoder chains (CB-RM pattern)

------

## 9. **Comparison Table**

| Feature                    | RingBuffer | BipBuffer | PingPong | FAD  | 3D   | Out-of-Core |
| -------------------------- | ---------- | --------- | -------- | ---- | ---- | ----------- |
| Fixed-size                 | ✅          | ✅         | ✅        | ✅    | ✅    | ❌ (virtual) |
| Zero-copy supported        | 🚫          | ✅         | 🚫        | ✅    | ❌    | ✅           |
| Interpolated read          | 🚫          | 🚫         | 🚫        | ✅    | 🚫    | ❌           |
| Async-capable              | 🚫          | ✅         | ✅        | 🚫    | 🚫    | ✅           |
| Contiguous memory reserved | 🚫          | ✅         | ✅        | 🚫    | ❌    | ❌           |



------

## 10. **Implementation Notes**

- Internal layout: array-based vs. typed arrays
- Wrap logic and modular math
- Locking/concurrency design (if implemented)
- Strategy pattern vs. subclassing
- Testing methodology (property-based tests, fuzzing)
- Memory safety considerations

------

## 11. **Contributions & Extensions**

- Ideas for future variants: UndoBuffer, ReplayBuffer, RateAdaptiveBuffer
- Hooks for integration with WebAudio, shared memory, wasm
- Extending buffer metadata: timestamped items, TTL, priority
- Pluggable eviction or sampling policies

------

## 11b. **Advanced Inspirations from Domain-Specific Systems**

- From telecom: **rate-matching buffers**, **bit-puncturing**, **interleaving schemes**
- From media: **time-stamped buffering**, **interpolated read/write for delay simulation**
- From networking: **zero-copy IO patterns**, **stream-to-chunk conversion**
- These may inspire:
  - New **policy types** (e.g., "rate-adaptive eviction policy")
  - New **buffer variants** (e.g., `InterleavedRingBuffer`, `BitmaskBuffer`)
  - Or future **modes** (e.g., `"telecom-friendly"` or `"wave-sim"`)

## 12. **FAQ**

- Why not just use a queue?
- How is this better than a plain array?
- Can it be used in React / WebAudio / Node streams?
- What happens when the buffer is full?

------

## 13. **License & Credits**

- License (MIT / Apache / dual?)
- Acknowledgments (Simon Cooke for BipBuffer, Boost, academic sources)
- Links to academic papers or patents referenced

------

## 14. **Appendices**

- A. Full type definitions
- B. Performance benchmark results
- C. Diagrams of pointer layouts and buffer states
- D. Glossary (overwrite policy, interpolation, wrap point, etc.)
- E. Policies vs. Modes



### Policies vs. Nodes

#### 🔁 **Modes** are user-facing **configuration presets**:

- Think of modes as **named bundles of behavior**.
- Example: `"overwrite"` mode could internally imply a certain overwrite policy + a wrap-around indexer.
- Modes are typically **exclusive** (you’re in one mode at a time) and often used to simplify API usage.

------

#### 🧩 **Policies** are **independent behavioral units**:

- Policies control *how* something behaves under a specific condition—e.g., **what to do when full**, **how to allocate memory**, **how to resolve conflicts**.
- They are **modular** and can be combined freely.
- They often form the **building blocks of modes**.

------

#### 🔄 Example Mapping

| Feature           | As Policy                               | As Mode                    |
| ----------------- | --------------------------------------- | -------------------------- |
| On buffer full    | `OverwriteOldest`, `ThrowOnFull`        | `"overwrite"`, `"strict"`  |
| Memory allocation | `EagerAlloc`, `LazyAlloc`               | `"low-memory"`             |
| Access pattern    | `WrapAround`, `SlidingWindow`           | `"real-time"`, `"sliding"` |
| Concurrency       | `SingleThread`, `MultiProducerConsumer` | `"thread-safe"`            |



So:

- If you're designing a low-level API: **use policies** — flexible, orthogonal, composable.
- If you're designing a high-level API: **expose modes** — easier mental model, backed by specific policy combos.

------

#### 🧠 TL;DR:

> **Policies** define the knobs; **modes** are presets that turn them in specific ways.





---



Notes

> **“No inspiration without crossdomain applicability.”**

You avoid bloating the library with single-purpose academic curiosities, and instead cultivate a **lean, extensible core** informed by proven, **reusable abstractions**.

## ✅ **Potentially Crossdomain-Worthy Concepts**

### 1. **Eviction Policies: Overwrite / Throw / Block**

- **Already crossdomain** (queues, loggers, telemetry, DSP)
- **Keep** — core policy

------

### 2. **Fractional Read/Write Pointer (from delay lines)**

- Crossdomain potential:
  - Audio: delay, chorus, phaser
  - Simulation: interpolated values in time-based systems
  - Animation: fractional frame indexing
- **Keep** — as `InterpolatableBuffer` or `FractionalDelayBuffer`

------

### 3. **Vector of Circular Buffers**

- Crossdomain potential:
  - Sharded logging systems
  - Multichannel sensor arrays
  - Multi-stream data ingestion
- **Keep** — could be a `CompositeBuffer` mode or variant

------

### 4. **Bit-mapped interleaving**

- Telecom-specific in origin, but…
- Could generalize as **"Bitmask-controlled access/transform policy"**
  - Data packing/unpacking
  - Security-related buffer masking
  - Interleaved I/O simulation
- **Worth prototyping** as a *BitmaskPolicy* or decorator

------

### 5. **Rate adaptation / CB-RM**

- Highly specific to coding theory
- Unless generalized as **variable-rate or elastic windowing**, little crossover
- **Exclude unless** we find generalized use (e.g. smoothing jitter in stream input)

------

### 6. **Error correction-aware buffering**

- Very domain-specific (e.g., HARQ)
- Could possibly be generalized into:
  - **Redundancy-aware retention**: keep packets longer based on likelihood of retransmit
  - **Confidence-weighted eviction**
- **Flag as "possible future exploration"**, not core

------

### 7. **Out-of-core buffering**

- Crossdomain potential:
  - Browsers, embedded devices, big data streams
  - Logging, checkpointing, cache spillover
- **Keep**, as an optional backing store policy (`MemoryStore | IndexedDBStore | FileStore`)

------

### 🧠 Summary: Inclusion Grid

| Concept                    | Crossdomain? | Action        |
| -------------------------- | ------------ | ------------- |
| Eviction policies          | ✅            | **Core**      |
| Fractional pointer access  | ✅            | **Variant**   |
| Vector of ring buffers     | ✅            | **Variant**   |
| Bit-mapped interleaving    | ☑️ Maybe      | **Prototype** |
| Rate adaptation (CB-RM)    | ❌            | Skip for now  |
| Error correction-aware buf | ❌/☑️ Weak     | Flag as edge  |
| Out-of-core buffering      | ✅            | **Optional**  |