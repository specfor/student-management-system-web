import type {
  EnrollmentPriceAdjustment,
  EnrollmentStatus,
} from "@/types/enrollmentTypes";
import {
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
  sendDeleteRequest,
} from "@/utils/requests";

export function getEnrollments(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    sort?: {
      by: "student_id" | "created_at" | "id";
      direction: "asc" | "desc";
    };
    filters?: {
      course_id?: number;
      student_id?: number;
      instructor_id?: number;
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.course_id) params.course_id = options.filters.course_id;
  if (options?.filters?.student_id)
    params.student_id = options.filters.student_id;
  if (options?.filters?.instructor_id)
    params.instructor_id = options.filters.instructor_id;

  return sendGetRequest("/enroll", params);
}

export function getEnrollmentById(enrollmentId: number) {
  return sendGetRequest("/enroll/enrollment/" + enrollmentId);
}

export function getStudentEnrollmentOfCourse(
  courseId: number,
  studentId: number
) {
  return sendGetRequest(`/enroll/${courseId}/${studentId}`);
}

export function enrollCourse(
  course_id: number,
  student_id: number,
  discount_type: EnrollmentPriceAdjustment["type"],
  discount_amount: number,
  discount_reason: string
) {
  const params: { [key: string]: any } = {
    student_id: student_id,
  };
  if (discount_type && discount_amount) {
    params["price_adjustment"] = {
      type: discount_type,
      reason: discount_reason,
    };
    if (discount_type == "fixed")
      params["price_adjustment"].amount = discount_amount;
    else params["price_adjustment"].percentage = discount_amount;
  }
  return sendJsonPostRequest("/enroll/" + course_id, params);
}

export function updateEnrollment(
  id: number,
  suspend: boolean,
  discount_type: EnrollmentPriceAdjustment["type"],
  discount_amount: number,
  discount_reason: string,
  status: EnrollmentStatus["type"],
  status_reason: string
) {
  const params: { [key: string]: any } = {
    suspend: suspend,
  };
  if (discount_type === "none") params["remove_price_adjustment"] = true;
  else if (discount_type) {
    params["price_adjustment"] = {
      type: discount_type,
      reason: discount_reason,
    };
    if (discount_type === "fixed")
      params["price_adjustment"].amount = discount_amount;
    else params["price_adjustment"].percentage = discount_amount;
  }
  params["status"] = { type: status, reason: status_reason };

  return sendJsonPatchRequest(`/enroll/${id}`, params);
}

export function getStudentEnrollments(
  studentId: number,
  startIndex = 0,
  limit: null | number = null
) {
  return sendGetRequest(`/enroll/student/${studentId}`);
}

export function deleteEnrollment(id: number) {
  return sendDeleteRequest("/enroll/" + id);
}
