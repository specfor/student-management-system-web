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
