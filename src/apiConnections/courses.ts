import type { CourseFee, CourseSchedule } from "@/types/courseTypes";
import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/utils/requests";

export function getCourses(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: {
      name?: string;
      instructor_id?: number;
      grade_id?: number;
    };
    sort?: {
      by: "name" | "id";
      direction: "asc" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters?.name) params.name = options.filters.name;
  if (options?.filters?.instructor_id)
    params.instructor_id = options.filters.instructor_id;
  if (options?.filters?.grade_id) params.grade_id = options.filters.grade_id;

  return sendGetRequest("/courses", params);
}

export function createCourse(
  name: string,
  group_name: string,
  instructor_id: number,
  day: CourseSchedule["day"],
  start_time: string,
  end_time: string,
  venue: string,
  fee_type: CourseFee["type"],
  amount: number,
  instructor_fee_percent: number,
  grade_id: number,
  print_name: string
) {
  const t = `${start_time}-${end_time}`;

  return sendJsonPostRequest("/courses", {
    name: name,
    group_name: group_name,
    grade_id: grade_id,
    instructor_id: instructor_id,
    enrollment_open: true,
    mode: "physical",
    schedule: [
      {
        day: day,
        time: t,
        mode: "physical",
        venue: venue,
      },
    ],
    fee: {
      type: fee_type,
      amount: amount,
    },
    instructor_fee_percent,
    print_name,
  });
}

export function updateCourse(
  id: number,
  name: string,
  group_name: string,
  instructor_id: number,
  day: CourseSchedule["day"],
  start_time: string,
  end_time: string,
  venue: string,
  fee_type: CourseFee["type"],
  amount: number,
  instructor_fee_percent: number,
  grade_id: number,
  print_name: string
) {
  const t = `${start_time}-${end_time}`;

  return sendJsonPatchRequest(`/courses/${id}`, {
    name: name,
    group_name: group_name,
    grade_id: grade_id,
    instructor_id: instructor_id,
    enrollment_open: true,
    mode: "physical",
    schedule: [
      {
        day: day,
        time: t,
        mode: "physical",
        venue: venue,
      },
    ],
    fee: {
      type: fee_type,
      amount: amount,
    },
    instructor_fee_percent,
    print_name,
  });
}

export function deleteCourse(id: number) {
  return sendDeleteRequest(`/courses/${id}`);
}
