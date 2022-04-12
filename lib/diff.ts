import libdiff from "https://deno.land/x/microdiff@v1.3.0/index.ts";
import {
  isNumber,
  isObject,
  isString,
  isUndefined,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { IssuePut } from "./types.ts";

type DiffItem = {
  type: "CREATE" | "REMOVE" | "CHANGE";
  path: (string | number)[];
  value?: unknown;
  oldValue?: unknown;
};

type Diff = {
  properties: DiffItem[];
  description?: string;
};

// only
const shrinkPut = (x: IssuePut) => {
  return {
    subject: x.subject,
    description: x.description,
    project_id: x.project_id,
    tracker_id: x.tracker_id,
    status_id: x.status_id,
    done_ratio: x.done_ratio,
    notes: x.notes,
  };
};

export const diff = async (
  before: IssuePut,
  after: IssuePut,
): Promise<Diff> => {
  const ds: DiffItem[] = libdiff(shrinkPut(before), shrinkPut(after)).map(
    (d) => {
      return d;
    },
  );
  const ix = ds.findIndex((d) => d.path.at(0) == "description");
  if (ix >= 0) {
    const description = ds[ix];
    const oldValue = description.oldValue as string;
    const newValue = description.value as string;
    ds.splice(ix, 1);
    let oldF: string | undefined;
    let newF: string | undefined;
    try {
      oldF = Deno.makeTempFileSync();
      newF = Deno.makeTempFileSync();
      Deno.writeTextFileSync(oldF, oldValue + "\n");
      Deno.writeTextFileSync(newF, newValue + "\n");
      const p = Deno.run({
        cmd: ["diff"].concat(["-u", oldF, newF]),
        stdout: "piped",
      });
      const description = new TextDecoder()
        .decode(await p.output())
        .split(/\n/)
        .filter((_, i) => i > 1) // remove first two lines
        .join("\n");
      return { properties: ds, description };
    } finally {
      if (oldF) Deno.removeSync(oldF);
      if (newF) Deno.removeSync(newF);
    }
  } else {
    return { properties: ds };
  }
};

export const render = (diff: Diff): string => {
  const out: string[] = [];
  const { properties, description } = diff;
  // properties
  if (properties?.length > 0) {
    out.push("[properties change]");
    properties.forEach((p) => {
      const { path, value, oldValue } = p;
      const pathStr = path.join(".");
      if (
        (isObject(value) ||
          isUndefined(value) ||
          isNumber(value) ||
          isString(value)) &&
        (isObject(oldValue) ||
          isUndefined(oldValue) ||
          isNumber(oldValue) ||
          isString(oldValue))
      ) {
        const valueStr = value?.toString();
        const oldValueStr = oldValue?.toString();
        out.push(`${pathStr}:`);
        out.push(`- ${oldValueStr}`);
        out.push(`+ ${valueStr}`);
      } else {
        throw new Error(`
          { toString(): string } expected, but got:
            value:    ${value}
            oldValue: ${oldValue}
        `);
      }
    });
  }
  // description
  if (description) {
    out.push("[description change]");
    out.push(description);
  }
  return out.join("\n");
};

export const isEmpty = (diff: Diff) => {
  return diff.properties.length === 0 && !diff.description;
};
