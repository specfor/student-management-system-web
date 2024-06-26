import { sendJsonPostRequest, sendGetRequest } from "@/utils/requests";

export function getPayments(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: { course_id?: number; student_id?: number };
    sort?: {
      by: "enrollment_id" | "created_at" | "id" | "amount";
      direction: "acs" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.filters?.course_id)
    params["course_id"] = options?.filters?.course_id;
  if (options?.filters?.student_id)
    params["student_id"] = options?.filters?.student_id;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  return sendGetRequest("/payments", params);
}

export function createPayment(
  enrollmentId: number,
  amount: number,
  paymentTime: string = ""
) {
  return sendJsonPostRequest("/payments/" + enrollmentId, {
    payment_method: "cash",
    amount: amount,
    payment_for: paymentTime,
  });
}

export function refundPayment(paymentId: number, reason: string) {
  return sendJsonPostRequest(`/payments/refund/${paymentId}`, {
    reason: reason,
  });
}
