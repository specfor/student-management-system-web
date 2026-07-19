import { sendGetRequest } from "@/utils/requests";

export function getStudentCount(month?: string) {
  const params = month ? { month } : {};
  return sendGetRequest("/analytics/students/count", params);
}

export function getEnrollmentCount() {
  return sendGetRequest("/analytics/enrollments/count");
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
export function getOutstandingPayments() {
  return sendGetRequest("/analytics/outstanding-payments");
}

/** Card C — Instructor Payment Status */
export function getInstructorPaymentStatus() {
  return sendGetRequest("/analytics/instructor-payment-status");
}

/** Card E — Attendance Rate Tracker */
export function getAttendanceRate() {
  return sendGetRequest("/analytics/attendance-rate");
}

