import { sendGetRequest, sendJsonPostRequest } from "@/utils/requests";

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
  notes: string,
  startTime: string,
  endTime: string
) {
  return sendJsonPostRequest("/course-conduct", {
    class_id: classId,
    date,
    status,
    notes: [notes],
    startTime,
    endTime,
  });
}

export async function resheduleClass(
  classId: number,
  formDate: string,
  toData: string,
  startTime: string,
  endTime: string
) {
  return sendJsonPostRequest("/course-conduct/reschedule/" + classId, {
    from_date: formDate,
    to_date: toData,
    startTime,
    endTime,
  });
}
