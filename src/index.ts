const SYMBOL_DESCRIPTION_MATCHER = /^Symbol\((?<description>.*)\)$/;
/* v8 ignore next */
const PROXY_TARGET = function () {}; // Proxy target must be callable and constructable

/**
 * Returns the string representation of a property accessor path
 *
 * Here's how certain types of paths are represented:
 * - Property access as its name (e.g. `a.b.c`)
 * - Array index accessor as the index with "dot" (e.g. `a.0`) or "brackets" (e.g. `a[0]`) notation
 * - Symbols as their description
 *
 * @param pathAccessorFn The path to stringify
 * @param options Options for stringification
 * @example
 * stringifyAccessor<MyType>(o => o.a.b?.c?.[0].d); // "a.b.c[0].d"
 * @throws When `stringifySymbols === undefined` and there are symbols in the path
 * @returns The string representation of the path
 */
export default function stringifyAccessor<T extends object>(
  pathAccessorFn: (obj: T) => unknown,
  options?: {
    /**
     * How to represent array index accessor segments: with a dot (`a.0`) or wrapped in brackets (`a[0]`)
     *
     * @default brackets
     * @example
     * stringifyAccessor<MyType>(o => o[0], { arrayIndexNotation: "dot" }); // "0"
     * stringifyAccessor<MyType>(o => o.a?.[0].b, { arrayIndexNotation: "dot" }); // "a.0.b"
     * stringifyAccessor<MyType>(o => o[0], { arrayIndexNotation: "brackets" }); // "[0]"
     * stringifyAccessor<MyType>(o => o.a?.[0].b, { arrayIndexNotation: "brackets" }); // "a[0].b"
     */
    arrayIndexNotation?: "dot" | "brackets";

    /**
     * Represent symbols as their description. When `false`, symbol access will throw an `Error`.
     *
     * @default true
     * @example
     * stringifyAccessor<MyType>(o => o.a[mySymbol]); // default: "a.mySymbol"
     * stringifyAccessor<MyType>(o => o.a[mySymbol], { stringifySymbols: true }); // explicit: "a.mySymbol"
     * stringifyAccessor<MyType>(o => o.a[mySymbol], { stringifySymbols: false }); // throws Error
     */
    stringifySymbols?: boolean;

    /**
     * @description Act like C#'s `nameof` function and output only the last segment in the path
     *
     * @default undefined
     * @example
     * stringifyAccessor<MyType>(o => o.a.b.c?.[0], { finalSegmentOnly: true }); // "c[0]"
     * stringifyAccessor<MyType>(o => o.a.b.c, { finalSegmentOnly: true }); // "c"
     * stringifyAccessor<MyType>(o => o, { finalSegmentOnly: true }); // ""
     */
    finalSegmentOnly?: true;
  },
): string {
  const segments: string[] = [];
  const arrayIndexNotation = options?.arrayIndexNotation ?? "brackets";
  const finalSegmentOnly = options?.finalSegmentOnly ?? false;
  const stringifySymbols = options?.stringifySymbols ?? true;
  const proxy: T = new Proxy<T>(PROXY_TARGET as T, {
    apply: () => proxy,
    construct: () => proxy,
    get(_, prop: string | symbol) {
      let nextSegment = `.${String(prop)}`;

      if (typeof prop === "symbol") {
        if (stringifySymbols) {
          const symbolDescription = SYMBOL_DESCRIPTION_MATCHER.exec(
            prop.toString(),
          )?.groups?.description;
          nextSegment = `.${symbolDescription}`;
        } else {
          throw new Error("Cannot print path which contains symbols.");
        }
      } else if (!isNaN(parseInt(prop)) && arrayIndexNotation === "brackets") {
        nextSegment = `[${prop}]`;
      }

      segments.push(nextSegment);

      return proxy;
    },
  });

  pathAccessorFn(proxy);

  const path = finalSegmentOnly
    ? segments[segments.length - 1]
    : segments.join("");
  const finalPath = path.startsWith(".") ? path.substring(1) : path;

  return finalPath;
}
