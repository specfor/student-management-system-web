import {
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export function getBills(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: {
      student_id?: number;
      status?: "pending" | "printed" | "cancelled";
    };
    sort?: {
      by: "id" | "student_id";
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
  if (options?.filters?.status) params.status = options.filters.status;
  if (options?.filters?.student_id)
    params.student_id = options.filters.student_id;
  return sendGetRequest("/print-queue", params);
}

export function createBill(
  student_id: number,
  payment_ids: Array<number>,
  bill_id: number = -1
) {
  return sendJsonPostRequest("/print-queue", {
    student_id,
    payment_ids,
    bill_id,
  });
}

export function updateBillStatus(
  bill_id: number,
  status: "cancelled" | "pending" | "printed"
) {
  const sendBody: { [key: string]: any } = {
    bill_id,
    status,
  };
  return sendJsonPatchRequest(`/print-queue`, sendBody);
}
