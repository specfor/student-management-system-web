import { sendGetRequest } from "@/utils/requests";

export function getStudentCount() {
  return sendGetRequest("/analytics/students/count");
}

export function getMonthlyFinancialSummary(year: number, month: number) {
  return sendGetRequest("/analytics/summary/financial", {
    year,
    month,
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
