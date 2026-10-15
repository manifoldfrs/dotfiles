const MAX_X_HANDLES = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const X_HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

export interface XaiSearchParams {
  query: string;
  model?: string;
  from_date?: string;
  to_date?: string;
  allowed_x_handles?: string[];
  excluded_x_handles?: string[];
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
}

export interface XaiSearchRequest {
  model: string;
  query: string;
  xSearchTool: Record<string, unknown>;
}

function normalizeDate(value: string | undefined, field: "from_date" | "to_date"): string | undefined {
  if (value === undefined) return undefined;

  const date = value.trim();
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`${field} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`${field} must be a valid calendar date`);
  }
  return date;
}

function normalizeHandles(
  values: string[] | undefined,
  field: "allowed_x_handles" | "excluded_x_handles",
): string[] | undefined {
  if (values === undefined) return undefined;
  if (values.length === 0 || values.length > MAX_X_HANDLES) {
    throw new Error(`${field} must contain between 1 and ${MAX_X_HANDLES} handles`);
  }

  const seen = new Set<string>();
  return values.map((value, index) => {
    const handle = value.trim().replace(/^@/, "");
    if (!X_HANDLE_PATTERN.test(handle)) {
      throw new Error(`${field}[${index}] must be a valid X handle`);
    }
    const key = handle.toLowerCase();
    if (seen.has(key)) throw new Error(`${field} must not contain duplicate handles`);
    seen.add(key);
    return handle;
  });
}

// xAI applies from_date from 00:00 UTC and treats to_date as exclusive, so dates pass through unchanged.
export function buildXaiSearchRequest(params: XaiSearchParams, defaultModel: string): XaiSearchRequest {
  const query = params.query.trim();
  if (!query) throw new Error("query must not be empty");

  const model = (params.model ?? defaultModel).trim();
  if (!model) throw new Error("model must not be empty");

  const fromDate = normalizeDate(params.from_date, "from_date");
  const toDate = normalizeDate(params.to_date, "to_date");
  if (fromDate && toDate && fromDate >= toDate) {
    throw new Error(
      "from_date must be before to_date; to_date is exclusive, so to search one day set to_date to the following day",
    );
  }

  const allowedHandles = normalizeHandles(params.allowed_x_handles, "allowed_x_handles");
  const excludedHandles = normalizeHandles(params.excluded_x_handles, "excluded_x_handles");
  if (allowedHandles && excludedHandles) {
    throw new Error("allowed_x_handles and excluded_x_handles cannot be used together");
  }

  const xSearchTool: Record<string, unknown> = { type: "x_search" };
  if (fromDate) xSearchTool.from_date = fromDate;
  if (toDate) xSearchTool.to_date = toDate;
  if (allowedHandles) xSearchTool.allowed_x_handles = allowedHandles;
  if (excludedHandles) xSearchTool.excluded_x_handles = excludedHandles;
  if (params.enable_image_understanding !== undefined) {
    xSearchTool.enable_image_understanding = params.enable_image_understanding;
  }
  if (params.enable_video_understanding !== undefined) {
    xSearchTool.enable_video_understanding = params.enable_video_understanding;
  }

  return { model, query, xSearchTool };
}
