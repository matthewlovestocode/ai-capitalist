# Repository Guidance

## Code Comments

All functions and React components should include JSDoc-style block comments.

Use comments that explain the purpose, important inputs, return value, and any non-obvious behavior. Prefer this format:

```ts
/**
 * Calculates the current net profit for a venture after operating costs.
 *
 * @param venture - The venture being evaluated.
 * @param state - The current game state used for salary and benefit costs.
 * @returns The net profit available after costs are deducted.
 */
function calculateNetProfit(venture: Venture, state: GameState) {
  // ...
}
```

Avoid replacing JSDoc with single-line comments for functions or components. Single-line comments are still fine inside a function when they clarify a specific implementation detail.
