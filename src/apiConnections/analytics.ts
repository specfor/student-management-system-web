import { sendGetRequest } from "@/utils/requests";

export function getStudentCount() {
  return sendGetRequest("/analytics/students/count");
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
