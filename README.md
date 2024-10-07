# `stringify-accessor`

> Typesafe, runtime stringification of property accessor paths powered by ES6 Proxies

## Install

```sh
npm i stringify-accessor
```

## Usage

```typescript
import stringifyAccessor from "stringify-accessor";

interface FormFields {
  name: {
    first: string;
    last: string;
    suffix?: string;
  };
  favoriteColors?: {
    hex: string;
    name: string;
  }[];
}

stringifyAccessor<FormFields>((form) => form.favoriteColors?.[0].hex); //=> favoriteColors[0].hex
```

### Example: Typesafe form input names

```typescript
import { set } from "lodash";
import stringifyAccessor from "stringify-accessor";

interface FormFields {
  name: {
    first: string;
    last: string;
    suffix?: string;
  };
  favoriteColors?: {
    hex: string;
    name: string;
  }[];
}

export function MyForm() {
  function processForm(
    e: Event & {
      currentTarget: HTMLFormElement;
    }
  ) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = {};

    for (const [key, value] of formData.entries()) {
      set(form, key, value);
    }

    return form as FormFields;
  }
  const favoriteColors: NonNullable<FormFields['favoriteColors']> = [{ hex: "", name: "" }, { hex: "", name: "" }]

  return (
    <form onSubmit={e => {
        const form = processForm(e);
        console.log(form); //=> { name: { first: "", last: "", suffix: "" }, favoriteColors: [{ hex: "", name: "" }, { hex: "", name: "" }] }
    }}>
      <input
        name={stringifyAccessor<FormFields>((form) => form.name.first)}
        type="text"
      />
      <input
        name={stringifyAccessor<FormFields>((form) => form.name.last)}
        type="text"
      />
      <input
        name={stringifyAccessor<FormFields>((form) => form.name?.suffix)}
        type="text"
      />
      <p>List your two favorite colors</p>
      <ul>
          {favoriteColors.map((color, i) => (
              <li>
                  <input
                      name={stringifyAccessor<FormFields>(
                          (form) => form.favoriteColors?.[i].hex
                      )}
                      type="color"
                      value={color.hex}
                  />
                  <input
                      name={stringifyAccessor<FormFields>(
                          (form) => form.favoriteColors?.[i].name
                      )}
                      type="text"
                      value={color.name}
                  />
              </li>
          ))}
      </ul>
      <button type="submit">submit</button>
    </form>
  );
}
```

### Benchmarking

> All benchmarks were run on a 2017 Macbook Pro with macOS Ventura 13.6.9, 2.9 GHz Quad-Core Intel Core i7.

#### Without caching

| Operation                                     | ops/sec | Average Time (ns) | Margin | Samples |
| --------------------------------------------- | ------- | ----------------- | ------ | ------- |
| 3-level property access (full path)           | 585,716 | 1707.31           | ±6.49% | 5858    |
| 3-level property & index access (full path)   | 510,674 | 1958.19           | ±4.44% | 5107    |
| 6-level property access (full path)           | 486,987 | 2053.44           | ±6.89% | 4870    |
| 6-level property & index access (full path)   | 425,281 | 2351.39           | ±6.84% | 4253    |
| 26-level property access (full path)          | 213,621 | 4681.19           | ±6.59% | 2137    |
| 26-level property access (final segment)      | 265,713 | 3763.45           | ±4.16% | 2658    |
| Mixed index, property, and symbol access      | 306,723 | 3260.27           | ±6.10% | 3068    |
| Accessing built-in properties (e.g. `Window`) | 475,806 | 2101.70           | ±1.10% | 4759    |

#### With caching

The `stringifyAccessor` function doesn't use caching, but it can be trivially added. There is a reference memoization implementation using `Map` in [memoized.benchmark.ts](src/memoized.benchmark.ts).

| Operation                                     | ops/sec   | Average Time (ns) | Margin | Samples |
| --------------------------------------------- | --------- | ----------------- | ------ | ------- |
| 3-level property access (full path)           | 2,119,916 | 471.72            | ±3.54% | 10600   |
| 3-level property & index access (full path)   | 2,323,370 | 430.41            | ±0.43% | 11617   |
| 6-level property access (full path)           | 2,198,950 | 454.76            | ±0.52% | 10995   |
| 6-level property & index access (full path)   | 2,186,722 | 457.31            | ±3.32% | 10934   |
| 26-level property access (full path)          | 2,236,710 | 447.09            | ±3.20% | 11184   |
| 26-level property access (final segment)      | 810,910   | 1233.18           | ±3.22% | 4055    |
| Mixed index, property, and symbol access      | 803,526   | 1244.51           | ±4.02% | 4018    |
| Accessing built-in properties (e.g. `Window`) | 2,321,672 | 430.72            | ±0.83% | 11609   |
