import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";

export function getStudentCount(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/students/count", params);
}

export function getEnrollmentCount(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/enrollments/count", params);
}

export function getMonthlyFinancialSummary(year: number, month: number, byMarkedMonth: boolean) {
  return sendGetRequest("/analytics/summary/financial", {
    year,
    month,
    use_marked_month: byMarkedMonth,
  });
}

export function getInstructorMonthyPaymentCalculations(
  instructorId: number,
  year: number,
  month: number,
  paymentsBy: "marked_month" | "paid_month"
) {
  return sendGetRequest("/analytics/payments/instructor/" + instructorId, {
    year,
    month,
    payments_by: paymentsBy,
  });
}

export function getFinancialSummaryForMonths(monthsBackward: number) {
  return sendGetRequest("/analytics/summary/financial/for-months", {
    "months-backward": monthsBackward,
  });
}

export function getStudentMonthlyPaymentSummary(year: number, month: number) {
  return sendGetRequest("/analytics/summary/student-payments", {
    year,
    month,
  });
}

export function getCourseCalendar(year: number, month: number) {
  return sendGetRequest("/analytics/course-calendar", {
    year,
    month,
  });
}

/** Card B — Outstanding Payments */
export function getOutstandingPayments(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/outstanding-payments", params);
}

/** Card C — Instructor Payment Status */
export function getInstructorPaymentStatus(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/instructor-payment-status", params);
}

/** Card E — Attendance Rate Tracker */
export function getAttendanceRate(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/attendance-rate", params);
}

// Drill-down Detail Endpoints

export function getStudentDetails(month: string, filter: string, page: number = 1) {
  return sendGetRequest("/analytics/details/students", { month, filter, page });
}

export function getEnrollmentDetails(month: string, status: string, page: number = 1) {
  return sendGetRequest("/analytics/details/enrollments", { month, status, page });
}

export function getOutstandingPaymentDetails(month: string, status: string, page: number = 1) {
  return sendGetRequest("/analytics/details/outstanding-payments", { month, status, page });
}

export function getInstructorPaymentDetails(month: string, status: string, page: number = 1) {
  return sendGetRequest("/analytics/details/instructor-payments", { month, status, page });
}

export function getIncomeDetails(month: string, filter: string, useMarkedMonth: boolean, page: number = 1) {
  return sendGetRequest("/analytics/details/income", { month, filter, use_marked_month: useMarkedMonth, page });
}

export function getExpenseDetails(month: string, filter: string, useMarkedMonth: boolean, page: number = 1) {
  return sendGetRequest("/analytics/details/expenses", { month, filter, use_marked_month: useMarkedMonth, page });
}

export function getAdvancePaymentsSummary() {
  return sendGetRequest("/analytics/advance-payments/summary", {});
}

export function getAdvancePaymentDetails(page: number = 1) {
  return sendGetRequest("/analytics/advance-payments/details", { page });
}

export function getAttendedButUnpaidSummary() {
  return sendGetRequest("/analytics/attended-unpaid/summary", {});
}

export function getAttendedButUnpaidDetails(page: number = 1) {
  return sendGetRequest("/analytics/attended-unpaid/details", { page });
}

export function discardPayment(enrollmentId: number, month: string, type: string) {
  return sendJsonPostRequest("/analytics/payments/discard", { enrollment_id: enrollmentId, month, type });
}

export function recoverPayment(enrollmentId: number, month: string, amount: number, className: string | null) {
  return sendJsonPostRequest("/analytics/payments/recover", { enrollment_id: enrollmentId, month, amount, class_name: className });
}
