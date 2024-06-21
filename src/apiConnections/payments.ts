import { sendJsonPostRequest, sendGetRequest } from "@/baseFunctions/requests";

export function getPayments(startIndex = 0, limit: null | number = null) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

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
