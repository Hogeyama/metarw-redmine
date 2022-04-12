// deno-lint-ignore-file
import {
  isNumber,
  isObject,
  isString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { Denops } from "https://deno.land/x/denops_std@v3.3.1/mod.ts";

import { failure, Result, success } from "../../lib/common/result.ts";
import * as Api from "../../lib/api.ts";
import { render } from "../../lib/render.ts";
import { parse } from "../../lib/parse.ts";
import { diff } from "../../lib/diff.ts";
import * as Diff from "../../lib/diff.ts";

type Config = {
  host: string;
  apiKey: string;
};

export async function main(denops: Denops): Promise<void> {
  const mConfig = getConfig();
  if (!mConfig.isSuccess) {
    throw new Error(mConfig.error);
  }
  const config = mConfig.value;

  denops.dispatcher = {
    // arg: { issueId: string | number }
    async getIssue(arg): Promise<string> {
      if (!isObject(arg)) {
        throw new Error(
          "Argument must has type {issueId: string | number}",
        );
      }
      const issueId = parseIssueId(arg);
      if (!issueId.isSuccess) {
        throw new Error(issueId.error);
      }
      const result = await getIssue(config, { issueId: issueId.value });
      if (!result.isSuccess) {
        throw new Error(result.error);
      }
      return result.value;
    },

    // arg: { issueId: string | number, contents: string }
    async putIssue(arg): Promise<null> {
      if (!isObject(arg)) {
        throw new Error(
          `Argument must has type { issueId: string | number, body: string }`,
        );
      }
      const issueId = parseIssueId(arg);
      if (!issueId.isSuccess) {
        throw new Error(issueId.error);
      }
      const fileContents = arg?.contents;
      if (!isString(fileContents)) {
        throw new Error(
          `fileContents must be a string, but got ${fileContents}`,
        );
      }
      const result = await putIssue(config, {
        issueId: issueId.value,
        body: fileContents,
      });
      if (!result.isSuccess) {
        throw new Error(result.error);
      }
      return null;
    },

    // arg: { issueId: string | number, contents: string }
    async calcDiff(arg): Promise<string> {
      if (!isObject(arg)) {
        throw new Error(
          `Argument must has type { issueId: string | number, body: string }`,
        );
      }
      const issueId = parseIssueId(arg);
      if (!issueId.isSuccess) {
        throw new Error(issueId.error);
      }
      const fileContents = arg?.contents;
      if (!isString(fileContents)) {
        throw new Error(
          `fileContents must be a string, but got ${fileContents}`,
        );
      }
      const current = await Api.get({
        issueId: issueId.value,
        host: config.host,
        apiKey: config.apiKey,
      });
      if (!current.isSuccess) {
        throw new Error(current.error);
      }
      const parsed = parse(fileContents);
      const d = await diff(current.value, parsed);
      return Diff.render(d);
    },
  };
}

function getConfig(): Result<Config, string> {
  const getConfigFromEnv = (): Result<Config, string> => {
    let host = Deno.env.get("REDMINE_HOST");
    let apiKey = Deno.env.get("REDMINE_API_KEY");
    if (host && apiKey) {
      return success({ host, apiKey });
    } else {
      return failure("REDMINE_HOST and REDMINE_API_KEY must be set");
    }
  };
  const getConfigFromFile = (): Result<Config, string> => {
    const home = Deno.env.get("HOME");
    const file = `${home}/.redmine_api_key`;
    try {
      const contents = Deno.readTextFileSync(file)
        .trim()
        .split(/\n/);
      if (contents.length === 2) {
        return success({ host: contents[0], apiKey: contents[1] });
      } else {
        return failure(`${file} must contain 2 lines`);
      }
    } catch (e) {
      throw new Error(`Error on reading ${file}: ${e}`);
    }
  };
  return getConfigFromEnv().orElse(getConfigFromFile);
}

async function getIssue(
  config: Config,
  arg: { issueId: number },
): Promise<Result<string, string>> {
  const issue = await Api.get({
    issueId: arg.issueId,
    host: config.host,
    apiKey: config.apiKey,
  });
  return issue.map(render);
}

async function putIssue(
  config: Config,
  arg: { issueId: number; body: string },
): Promise<Result<null, string>> {
  const result = await Api.put({
    issueId: arg.issueId,
    body: parse(arg.body),
    host: config.host,
    apiKey: config.apiKey,
  });
  return result;
}

function parseIssueId(req: Record<string, unknown>): Result<number, string> {
  if (!isString(req?.issueId) && !isNumber(req?.issueId)) {
    return failure(
      `issueId must be a string or number, but got ${req.issueId}`,
    );
  }
  const id = Number(req.issueId);
  if (isNaN(id)) {
    return failure(`Invalid issueId: ${req.issueId}`);
  }
  return success(id);
}
