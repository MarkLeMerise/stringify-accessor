import { Bench } from "tinybench";
import stringifyAccessor from ".";
import { DeepObject, ComplexObject, mySymbol } from "./index.benchmark";

const cache = new Map<string, string>();

/**
 * A memoized version of the {@linkcode stringifyAccessor} function.
 *
 * Few applications should reach the scale where `stringifyAccessor` needs caching.
 * However, benchmarking shows memoization can offer a ~4x speed increase on average.
 */
export function memoizedStringifyAccessor<T extends object>(
  ...[fn, options]: Parameters<typeof stringifyAccessor<T>>
) {
  const key = JSON.stringify({
    fn,
    options,
  });

  if (cache.has(key)) {
    return cache.get(key) ?? "";
  }

  const value = stringifyAccessor<T>(fn, options);
  cache.set(key, value);

  return value;
}

const bench = new Bench({ time: 10 });

bench
  .add("3-level property access (full path)", () => {
    memoizedStringifyAccessor<DeepObject>((o) => o.a.b.c);
  })
  .add("3-level property & index access (full path)", () => {
    memoizedStringifyAccessor<DeepObject>((o) => o.a.array[0].b);
  })
  .add("6-level property access (full path)", () => {
    memoizedStringifyAccessor<DeepObject>((o) => o.a.b.c.d.e.f);
  })
  .add("6-level property & index access (full path)", () => {
    memoizedStringifyAccessor<DeepObject>((o) => o.a.b.c.array?.[0].f);
  })
  .add("26-level property access (full path)", () => {
    memoizedStringifyAccessor<DeepObject>(
      (o) => o.a.b.c.d.e.f.g.h.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z,
    );
  })
  .add("26-level property access (final segment)", () => {
    memoizedStringifyAccessor<DeepObject>(
      (o) => o.a.b.c.d.e.f.g.h.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z,
      { finalSegmentOnly: true },
    );
  })
  .add("Mixed index, property, and symbol access", () => {
    memoizedStringifyAccessor<ComplexObject>(
      (o) => o.a[mySymbol]?.b[0].c?.[1]?.d.e.f,
      {
        stringifySymbols: true,
      },
    );
  })
  .add("Accessing built-in properties", () => {
    memoizedStringifyAccessor<Window>(
      (window) => window.document.body.firstChild?.baseURI?.[1],
    );
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
