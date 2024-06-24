import {
  sendDeleteRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/baseFunctions/requests";

export function getAttendaceOfCourse(
  courseId: number,
  startIndex: number = 0,
  limit: boolean | null = null,
  options?: {
    sort?: {
      by: "student_id" | "date" | "id";
      direction: "acs" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  return sendGetRequest(`/attendance/${courseId}`, params);
}

export function sendMarkAttendance(courseId: number, studentId: number) {
  return sendJsonPostRequest("/attendance/" + courseId, {
    student_id: studentId,
  });
}

export function deleteAttendance(id: number) {
  return sendDeleteRequest(`/attendance/${id}`);
}
