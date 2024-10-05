import {
  sendDeleteRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/utils/requests";

export function getAttendace(
  startIndex: number = 0,
  limit: number | null = null,
  options?: {
    sort?: {
      by: "student_id" | "date" | "id";
      direction: "asc" | "desc";
    };
    filters?: {
      courseId?: number;
      studentId?: number;
      date_from?: string;
      date_to?: string;
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.courseId) params.course_id = options.filters.courseId;
  if (options?.filters?.studentId)
    params.student_id = options.filters.studentId;
  if (options?.filters?.date_from) params.date_from = options.filters.date_from;
  if (options?.filters?.date_to) params.date_to = options.filters.date_to;

  return sendGetRequest(`/attendance`, params);
}

export function getAttendaceOfCourseByEnrollmentId(
  enrollId: number,
  startIndex: number = 0,
  limit: number | null = null,
  options?: {
    sort?: {
      by: "date" | "id";
      direction: "asc" | "desc";
    };
    filters?: {
      date_from?: string;
      date_to?: string;
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.date_from) params.date_from = options.filters.date_from;
  if (options?.filters?.date_to) params.date_to = options.filters.date_to;

  return sendGetRequest(`/attendance/enrollment/${enrollId}`, params);
}

export function sendMarkAttendance(courseId: number, studentId: number) {
  return sendJsonPostRequest("/attendance/" + courseId, {
    student_id: studentId,
  });
}

export function deleteAttendance(id: number) {
  return sendDeleteRequest(`/attendance/${id}`);
}
