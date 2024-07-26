import { sendGetRequest } from "@/utils/requests";

export function getStudentCount() {
  return sendGetRequest("/analytics/students/count");
}

export function getMonthlyIncomeSummary(year: number, month: number) {
  return sendGetRequest("/analytics/summary/income", {
    year,
    month,
  });
}

export function getInstructorMonthyPaymentCalculations(
  instructorId: number,
  year: number,
  month: number
) {
  return sendGetRequest("/analytics/payments/instructor/" + instructorId, {
    year,
    month,
  });
}
