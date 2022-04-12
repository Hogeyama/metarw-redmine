// deno-lint-ignore-file camelcase

export type IssueGet = {
  id: number;
  subject: string;
  description: string;
  project: {
    id: number;
    name: string;
  };
  tracker: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
  author: {
    id: number;
    name?: string;
  };
  assigned_to: {
    id: number;
    name?: string;
  };
  priority: {
    id: number;
    name?: string;
  };
  start_date: string;
  due_date: string | null;
  done_ratio?: number;
  is_private: boolean;
  estimated_hours: number | null;
  total_estimated_hours: number | null;
  spent_hours: number;
  total_spent_hours: number;
  created_on: string;
  closed_on: string;
  updated_on: string;
};

export type IssuePut = {
  subject?: string;
  description?: string;
  project_id?: number;
  tracker_id?: number;
  status_id?: number;
  done_ratio?: number;
  notes?: string;
  last_updated_on?: string;
};
