// deno-lint-ignore-file camelcase
import { IssuePut } from "./types.ts";
import * as Yaml from "https://deno.land/std@0.140.0/encoding/yaml.ts";
import {
  assertNumber,
  assertObject,
  assertString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

// TODO Use Result type

export type Parsed = {
  id: number;
  description: string;
  subject?: string;
  done_ratio?: number;
  notes?: string;
  // 上書きしないためにチェックする必要がある
  last_updated_on?: string;
  // チェックしないこともできる。
  skip_check?: boolean;
  // TODO status はどうしようか。
  // 名前からidが逆引きできるならやる価値はあるかも。
  // -> 1.3から使えるらしい。うちの Redmine のバージョンいくつだっけ
};

export const toIssuePut = (issue: Parsed): IssuePut => {
  return {
    subject: issue.subject,
    description: issue.description,
    notes: issue.notes,
    done_ratio: issue.done_ratio,
    last_updated_on: issue.last_updated_on,
  };
};

const splitMetaAndBody = (issue: string): [string, string] => {
  const parts = issue.split(/\n---\n/);
  if (parts.length < 2) {
    throw new Error(`invalid issue: ${issue}`);
  }
  const meta = parts[0];
  const body = parts.slice(1).join("\n---\n");
  return [meta, body];
};

export const parse: (input: string) => Parsed = (input) => {
  const [meta, description] = splitMetaAndBody(input);
  const o = Yaml.parse(meta);
  assertObject(o);
  assertNumber(o?.id);
  assertNumber(o?.done_ratio);
  assertString(o?.subject);
  assertString(o?.last_updated_on);
  const issue: Parsed = {
    id: o.id,
    subject: o.subject,
    done_ratio: o.done_ratio,
    last_updated_on: o.last_updated_on,
    description: description.replace(/[\s]+$/g, "\n"),
  };
  // XXX 本当は省略可能フィールドの型もチェックしないといけない
  return issue;
};
