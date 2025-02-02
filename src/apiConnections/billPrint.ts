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
      bill_id?: number;
    };
    sort?: {
      by: "id" | "student_id" | "updated_at";
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
  if (options?.filters?.bill_id) params.bill_id = options.filters.bill_id;

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
  status?: "cancelled" | "pending" | "printed",
  remove_payment_ids?: number[]
) {
  const sendBody: { [key: string]: any } = {
    bill_id,
  };

  if (status) sendBody["status"] = status;
  if (remove_payment_ids) sendBody["remove_payment_ids"] = remove_payment_ids;

  return sendJsonPatchRequest(`/print-queue`, sendBody);
}

export function getGeneratedBillData(billId: number) {
  return sendGetRequest("/print-queue/bill", { bill_id: billId });
}

export async function sendBillPrintCommand(jsonData: string) {
  return sendJsonPostRequest("http://127.0.0.1:9000/bill", jsonData, {}, false);
}
