import { Bench } from "tinybench";
import stringifyAccessor from ".";

export interface DeepObject {
  a: {
    array: {
      b: unknown;
    }[];
    b: {
      c: {
        array: {
          f: unknown;
        }[];
        d: {
          e: {
            f: {
              g: {
                h: {
                  j: {
                    k: {
                      l: {
                        m: {
                          n: {
                            o: {
                              p: {
                                q: {
                                  r: {
                                    s: {
                                      t: {
                                        u: {
                                          v: {
                                            w: {
                                              x: {
                                                y: { z: unknown };
                                              };
                                            };
                                          };
                                        };
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}

export const mySymbol = Symbol("mySymbol");

export interface ComplexObject {
  a: {
    [mySymbol]?: {
      b: {
        c?: {
          d: { e: { f: unknown } };
        }[];
      }[];
    };
  };
}

const bench = new Bench({ time: 10 });

bench
  .add("3-level property access (full path)", () => {
    stringifyAccessor<DeepObject>((o) => o.a.b.c);
  })
  .add("3-level property & index access (full path)", () => {
    stringifyAccessor<DeepObject>((o) => o.a.array[0].b);
  })
  .add("6-level property access (full path)", () => {
    stringifyAccessor<DeepObject>((o) => o.a.b.c.d.e.f);
  })
  .add("6-level property & index access (full path)", () => {
    stringifyAccessor<DeepObject>((o) => o.a.b.c.array?.[0].f);
  })
  .add("26-level property access (full path)", () => {
    stringifyAccessor<DeepObject>(
      (o) => o.a.b.c.d.e.f.g.h.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z,
    );
  })
  .add("26-level property access (final segment)", () => {
    stringifyAccessor<DeepObject>(
      (o) => o.a.b.c.d.e.f.g.h.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z,
      { finalSegmentOnly: true },
    );
  })
  .add("Mixed index, property, and symbol access", () => {
    stringifyAccessor<ComplexObject>((o) => o.a[mySymbol]?.b[0].c?.[1]?.d.e.f, {
      stringifySymbols: true,
    });
  })
  .add("Accessing built-in properties", () => {
    stringifyAccessor<Window>(
      (window) => window.document.body.firstChild?.baseURI?.[1],
    );
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
