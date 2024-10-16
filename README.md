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

| Operation                                   | ops/sec   | Average Time (ns)  | Margin  | Samples |
| ------------------------------------------- | --------- | ------------------ | ------- | ------- |
| 3-level property access (full path)         | 1,142,291 | 875.4335173602115  | ±0.14%  | 11423   |
| 3-level property & index access (full path) | 1,089,693 | 917.6895313660268  | ±6.64%  | 10897   |
| 6-level property access (full path)         | 1,191,401 | 839.3473100922362  | ±0.16%  | 11915   |
| 6-level property & index access (full path) | 1,092,840 | 915.0468961722853  | ±0.14%  | 10929   |
| 26-level property access (full path)        | 642,842   | 1555.5921415274688 | ±11.47% | 6429    |
| 26-level property access (final segment)    | 492,503   | 2030.440875780181  | ±0.13%  | 4926    |
| Mixed index, property, and symbol access    | 555,239   | 1801.025442404724  | ±0.13%  | 5553    |
| Accessing built-in properties               | 675,735   | 1479.868724452705  | ±1.84%  | 6758    |
