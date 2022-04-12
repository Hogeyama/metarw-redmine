// deno-lint-ignore-file camelcase
import { IssueGet } from "./types.ts";

export type Rendered = {
  id: number;
  description: string;
  last_updated_on: string;
  subject: string;
  done_ratio?: number;
};

const fromIssueGet = (issue: IssueGet): Rendered => {
  const { id, description, updated_on, subject } = issue;
  return {
    id,
    description,
    done_ratio: issue.done_ratio,
    last_updated_on: updated_on,
    subject,
  };
};

export const render = (rawIssue: IssueGet): string => {
  const issue = fromIssueGet(rawIssue);
  return [
    `id: ${issue.id}\n`,
    `subject: "${issue.subject}"\n`,
    issue.done_ratio ? `done_ratio: ${issue.done_ratio}\n` : "",
    `last_updated_on: "${issue.last_updated_on}" # do not edit manually\n`,
    "---\n",
    `${issue.description.replace(/[\s]+$/g, "")}\n`, // remove trailing spaces
  ].join("");
};
