import { sendJsonPostRequest, sendGetRequest } from "@/utils/requests";

export function getStudentPayments(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: {
      course_id?: number;
      student_id?: number;
      instructor_id?: number;
      date_from?: string;
      date_to?: string;
    };
    sort?: {
      by: "enrollment_id" | "created_at" | "id" | "amount";
      direction: "acs" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

  if (options?.filters?.instructor_id)
    params["instructor_id"] = options?.filters?.instructor_id;
  if (options?.filters?.course_id)
    params["course_id"] = options?.filters?.course_id;
  if (options?.filters?.student_id)
    params["student_id"] = options?.filters?.student_id;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.date_from) params.date_from = options.filters.date_from;
  if (options?.filters?.date_to) params.date_to = options.filters.date_to;

  return sendGetRequest("/payments", params);
}

export function createStudentPayment(
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

export function refundStudentPayment(paymentId: number, reason: string) {
  return sendJsonPostRequest(`/payments/refund/${paymentId}`, {
    reason: reason,
  });
}

export function getInstructorPayments(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: {
      instructor_id?: number;
      date_from?: string;
      date_to?: string;
    };
    sort?: {
      by: "instructor_id" | "date_from" | "date_to";
      direction: "acs" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;

  if (options?.filters?.instructor_id)
    params["instructor_id"] = options?.filters?.instructor_id;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.date_from) params.date_from = options.filters.date_from;
  if (options?.filters?.date_to) params.date_to = options.filters.date_to;

  return sendGetRequest("/instructor-payments", params);
}

export function getStudentPaymentListForInstructorPaymentCalculation(
  instructor_id: number,
  year: number,
  month: number
) {
  const params = {
    instructor_id,
    year,
    month,
  };
  return sendGetRequest("/instructor-payments/list-student-payments", params);
}

export function getInstructorPaymentCalculated(
  payment_ids: number[],
  pending_payment_enrollment_ids: number[]
) {
  const params = { payment_ids, pending_payment_enrollment_ids };
  return sendJsonPostRequest("/instructor-payments/calculated-payment", params);
}

export function markInstructorPayment(
  instructor_id: number,
  payment_ids: number[],
  payment_month: number,
  payment_year: number,
  payment_amount: string,
  pending_payment_enrollment_ids: number[]
) {
  const params = {
    instructor_id,
    payment_amount,
    payment_ids,
    payment_month,
    payment_year,
    pending_payment_enrollment_ids,
  };
  return sendJsonPostRequest("/instructor-payments", params);
}
