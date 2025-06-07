import { sendGetRequest, sendJsonPatchRequest, sendJsonPostRequest } from "@/utils/requests";

export async function getClassConductRecords(classId?: number, date?: string, status?: string) {
  const params: Record<string, any> = {};
  if (classId !== undefined) {
    params.class_id = classId;
  }
  if (date !== undefined) {
    params.date = date;
  }
  if (status !== undefined) {
    params.status = status;
  }
  return sendGetRequest("/course-conduct", params);
}

export async function createUpdateClassConductRecord(
  classId: number,
  date: string,
  status: string,
  notes: string
) {
  return sendJsonPostRequest("/course-conduct", {
    class_id: classId,
    date,
    status,
    notes: [notes],
  });
}
