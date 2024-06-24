import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest,
} from "@/baseFunctions/requests";

export function getCourses(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    sort?: {
      by: "name" | "id";
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
  grade_id: number
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
  grade_id: number
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
  });
}

export function deleteCourse(id: number) {
  return sendDeleteRequest(`/courses/${id}`);
}
