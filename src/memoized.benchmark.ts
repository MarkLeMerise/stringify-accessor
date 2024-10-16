import stringifyAccessor from ".";
import { runBenchmark } from "./base.benchmark";

const cache = new Map<string, string>();

/**
 * A memoized version of the {@linkcode stringifyAccessor} function.
 *
 * Few applications should reach the scale where `stringifyAccessor` needs caching.
 * However, benchmarking shows memoization can offer a ~2-3x speed increase on average.
 */
export function memoizedStringifyAccessor<T extends object>(
  ...[fn, options]: Parameters<typeof stringifyAccessor<T>>
) {
  const key = JSON.stringify({
    fn: fn.toString(),
    options,
  });

  if (cache.has(key)) {
    return cache.get(key) ?? "";
  }

  const value = stringifyAccessor<T>(fn, options);
  cache.set(key, value);

  return value;
}

await runBenchmark(memoizedStringifyAccessor);
