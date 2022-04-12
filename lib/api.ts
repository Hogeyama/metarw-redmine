// deno-lint-ignore-file no-unused-vars ban-unused-ignore
import { IssueGet, IssuePut } from "./types.ts";
import { failure, Result, success } from "./common/result.ts";

export const get = async ({
  issueId,
  apiKey,
  host,
}: {
  issueId: number;
  apiKey: string;
  host: string;
}): Promise<Result<IssueGet, string>> => {
  const resp = await fetch(`${host}/issues/${issueId}.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Redmine-API-Key": apiKey,
    },
  });
  if (resp.ok) {
    const raw = (await resp.text()).replace(/\\r\\n/g, "\\n");
    try {
      return success(JSON.parse(raw).issue);
    } catch (e) {
      return failure(`Error on parsing response: ${e}`);
    }
  } else {
    return failure(resp.statusText);
  }
};

export const put = async ({
  issueId,
  body,
  apiKey,
  host,
}: {
  issueId: number;
  body: IssuePut;
  apiKey: string;
  host: string;
}): Promise<Result<null, string>> => {
  const x = await fetch(`${host}/issues/${issueId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Redmine-API-Key": apiKey,
    },
    body: JSON.stringify({
      issue: body,
    }),
  });
  if (!x.ok) {
    return failure(x.statusText);
  } else {
    return success(null);
  }
};
