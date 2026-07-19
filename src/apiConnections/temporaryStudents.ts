import {
  sendDeleteRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getTemporaryStudents(
  startIndex = 0,
  limit: number | null = null,
  options?: {
    filters?: {
      name?: string;
      phone_number?: string;
      grade_id?: number;
      fee_paid?: boolean;
    };
    sort?: {
      by: "name" | "id" | "created_at" | "grade_id";
      direction: "asc" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.name) params.name = options.filters.name;
  if (options?.filters?.phone_number) params.phone_number = options.filters.phone_number;
  if (options?.filters?.grade_id) params.grade_id = options.filters.grade_id;
  if (options?.filters?.fee_paid !== undefined) params.fee_paid = options.filters.fee_paid;

  return sendGetRequest("/temporary-students", params);
}

export function createTemporaryStudent(
  name: string,
  grade_id: number,
  phone_number?: string | null,
  registration_fee: number | string = 0,
  fee_paid: boolean = true,
  notes?: string | null
) {
  return sendJsonPostRequest("/temporary-students", {
    name,
    grade_id,
    phone_number: phone_number || null,
    registration_fee,
    fee_paid,
    notes: notes || null,
  });
}

function formatId(id: number | string): number {
  if (typeof id === "string" && /^(?:TEMP|REG)-/i.test(id)) {
    return parseInt(id.replace(/^(?:TEMP|REG)-/i, ""), 10);
  }
  return Number(id);
}

export function updateTemporaryStudent(
  id: number | string,
  data: {
    name?: string;
    grade_id?: number;
    phone_number?: string | null;
    registration_fee?: number | string;
    fee_paid?: boolean;
    notes?: string | null;
  }
) {
  return sendJsonPatchRequest(`/temporary-students/${formatId(id)}`, data);
}

export function deleteTemporaryStudent(id: number | string) {
  return sendDeleteRequest(`/temporary-students/${formatId(id)}`);
}

export function convertTemporaryStudent(
  id: number | string,
  data: {
    name?: string;
    full_name?: string | null;
    grade_id?: number;
    phone_number?: string | null;
    birthday?: string | null;
    school?: string | null;
    email?: string | null;
    address?: string | null;
    parent_name?: string | null;
    parent_phone_number?: string | null;
    custom_id?: string | null;
  } = {}
) {
  return sendJsonPostRequest(`/temporary-students/${formatId(id)}/convert`, data);
}

export function getTemporaryStudentReceiptData(id: number | string) {
  return sendGetRequest(`/temporary-students/${formatId(id)}/receipt`);
}

export function getTemporaryStudentReceiptImage(id: number | string) {
  return sendGetRequest(`/temporary-students/${formatId(id)}/receipt-image`);
}
