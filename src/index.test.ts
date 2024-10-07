import stringifyAccessor from ".";
import { describe, expect, suite, test } from "vitest";

suite("Printing property accessor", () => {
  describe("Property access", () => {
    test("Top-level", () => {
      interface TypeWithPropertyAccess {
        name: unknown;
      }

      expect(stringifyAccessor<TypeWithPropertyAccess>((obj) => obj.name)).toBe(
        "name",
      );
    });

    test("With optional", () => {
      interface TypeWithOptionalPropertyAccess {
        name?: unknown;
      }

      expect(
        stringifyAccessor<TypeWithOptionalPropertyAccess>((obj) => obj?.name),
      ).toBe("name");
    });

    test("Deep property path", () => {
      interface DeepPropertyPathType {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: unknown;
                };
              };
            };
          };
        };
      }

      expect(
        stringifyAccessor<DeepPropertyPathType>(
          (obj) => obj.level1.level2.level3.level4.level5.level6,
        ),
      ).toBe("level1.level2.level3.level4.level5.level6");
    });

    test("Deep property path with optional", () => {
      interface DeepPropertyPathType {
        level1: {
          level2: {
            level3: {
              level4?: {
                level5: {
                  level6: unknown;
                };
              };
            };
          };
        };
      }

      expect(
        stringifyAccessor<DeepPropertyPathType>(
          (obj) => obj.level1.level2.level3.level4?.level5.level6,
        ),
      ).toBe("level1.level2.level3.level4.level5.level6");
    });
  });

  describe("Symbol in path", () => {
    test("`stringifySymbols === true` prints symbol descriptions", () => {
      const mySymbol = Symbol("mySymbol");

      interface TypeWithSymbol {
        [mySymbol]: unknown;
      }

      expect(
        stringifyAccessor<TypeWithSymbol>((obj) => obj[mySymbol], {
          stringifySymbols: true,
        }),
      ).toBe("mySymbol");
    });

    test("`stringifySymbols === false` throws error", () => {
      const mySymbol = Symbol("mySymbol");

      interface TypeWithSymbol {
        [mySymbol]: unknown;
      }

      expect(() =>
        stringifyAccessor<TypeWithSymbol>((obj) => obj[mySymbol], {
          stringifySymbols: false,
        }),
      ).toThrowError();
    });
  });

  describe("Top-level array index access", () => {
    type TopLevelArrayType = unknown[];

    test("Default syntax", () => {
      expect(stringifyAccessor<TopLevelArrayType>((o) => o[0])).toBe("[0]");
    });

    test("Bracket syntax", () => {
      expect(
        stringifyAccessor<TopLevelArrayType>((o) => o[0], {
          arrayIndexNotation: "brackets",
        }),
      ).toBe("[0]");
    });

    test("Dot syntax", () => {
      expect(
        stringifyAccessor<TopLevelArrayType>((o) => o[0], {
          arrayIndexNotation: "dot",
        }),
      ).toBe("0");
    });
  });

  describe("Nested array index access", () => {
    interface NestedArrayType {
      list: unknown[];
    }

    test("With default array syntax", () => {
      expect(stringifyAccessor<NestedArrayType>((o) => o.list[0])).toBe(
        "list[0]",
      );
    });

    test("With dot syntax", () => {
      expect(
        stringifyAccessor<NestedArrayType>((o) => o.list[0], {
          arrayIndexNotation: "dot",
        }),
      ).toBe("list.0");
    });

    test("With brackets syntax", () => {
      expect(
        stringifyAccessor<NestedArrayType>((o) => o.list[0], {
          arrayIndexNotation: "brackets",
        }),
      ).toBe("list[0]");
    });
  });

  describe("Combined array, property, and symbol access", () => {
    const symbol1 = Symbol("symbol1");
    const symbol2 = Symbol("symbol2");

    interface ComplexType {
      a: {
        b?: {
          c?: {
            d?: {
              e: {
                [symbol1]: {
                  f: {
                    [symbol2]: unknown;
                  };
                }[];
              };
            };
          }[];
        };
      };
    }

    test("With dot array syntax", () => {
      expect(
        stringifyAccessor<ComplexType>(
          (o) => o.a.b?.c?.[0].d?.e[symbol1][1].f[symbol2],
          {
            arrayIndexNotation: "dot",
          },
        ),
      ).toBe("a.b.c.0.d.e.symbol1.1.f.symbol2");
    });

    test("With explicit symbol printing", () => {
      expect(
        stringifyAccessor<ComplexType>(
          (o) => o.a.b?.c?.[0].d?.e[symbol1][1].f[symbol2],
          {
            stringifySymbols: true,
          },
        ),
      ).toBe("a.b.c[0].d.e.symbol1[1].f.symbol2");
    });

    test("With default options", () => {
      expect(
        stringifyAccessor<ComplexType>(
          (o) => o.a.b?.c?.[0].d?.e[symbol1][1].f[symbol2],
        ),
      ).toBe("a.b.c[0].d.e.symbol1[1].f.symbol2");
    });
  });

  describe("Printing the final segment", () => {
    const mySymbol = Symbol("mySymbol");

    interface TypeWithSymbol {
      a?: {
        [mySymbol]: unknown[];
      };
    }

    test("Symbol", () => {
      expect(
        stringifyAccessor<TypeWithSymbol>((o) => o.a?.[mySymbol], {
          finalSegmentOnly: true,
          stringifySymbols: true,
        }),
      ).toBe("mySymbol");
    });

    test("Property", () => {
      expect(
        stringifyAccessor<TypeWithSymbol>((o) => o.a, {
          finalSegmentOnly: true,
        }),
      ).toBe("a");
    });

    describe("Array index", () => {
      test("Dot syntax", () => {
        expect(
          stringifyAccessor<TypeWithSymbol>((o) => o.a?.[mySymbol][0], {
            arrayIndexNotation: "dot",
            finalSegmentOnly: true,
            stringifySymbols: true,
          }),
        ).toBe("0");
      });

      test("Bracket syntax", () => {
        expect(
          stringifyAccessor<TypeWithSymbol>((o) => o.a?.[mySymbol][0], {
            arrayIndexNotation: "brackets",
            finalSegmentOnly: true,
            stringifySymbols: true,
          }),
        ).toBe("[0]");
      });
    });
  });

  test("Accessing top-level proxy returns empty string", () => {
    expect(stringifyAccessor<{}>((o) => o)).toBe("");
  });

  test("Accessing no properties returns empty string", () => {
    expect(stringifyAccessor<{}>((_) => {})).toBe("");
  });

  test("Accessing built-in properties", () => {
    expect(
      stringifyAccessor<Window>(
        (window) => window.document.body.firstChild?.baseURI?.[1],
      ),
    ).toBe("document.body.firstChild.baseURI[1]");
  });

  test("Returning `null` returns empty string", () => {
    expect(stringifyAccessor<{}>((_) => null)).toBe("");
  });

  test("Returning `undefined` returns empty string", () => {
    expect(stringifyAccessor<{}>((_) => undefined)).toBe("");
  });

  test("Returning `number` returns empty string", () => {
    expect(stringifyAccessor<{}>((_) => 1)).toBe("");
  });

  test("Accessor function contains arbitrary code", () => {
    expect(
      stringifyAccessor<{}>(async (_) => {
        await Promise.resolve(1);
      }),
    ).toBe("");
  });

  test("Property path contains function call", () => {
    interface TypeWithBehavior {
      a: {
        method(): {
          c?: {
            d: unknown;
          };
        };
        (_: null): { e: unknown };
      };
    }

    expect(stringifyAccessor<TypeWithBehavior>((o) => o.a.method().c?.d)).toBe(
      "a.method.c.d",
    );

    expect(stringifyAccessor<TypeWithBehavior>((o) => o.a(null).e)).toBe("a.e");
  });

  test("Property path contains new()", () => {
    interface TypeWithConstructors {
      new (): {
        a: {
          new (): {
            c?: {
              d: unknown;
            }[];
          };
        };
      };
    }

    expect(
      stringifyAccessor<TypeWithConstructors>((o) => new new o().a().c?.[0].d),
    ).toBe("a.c[0].d");
  });
});
