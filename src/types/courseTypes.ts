import type { Grade } from "./gradeTypes";
import type { Instructor } from "./InstructorTypes";

export type CourseSchedule = {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  time: string;
  mode: "physical" | "online" | "both";
  venue: string;
};

export type CourseFee = {
  type: "monthly" | "onetime" | "daily";
  amount: string;
};

export type Course = {
  id: number;
  name: string;
  schedule: CourseSchedule[];
  mode: "physical" | "online" | "both";
  fee: CourseFee;
  enrollment_open: boolean;
  grade_id: number;
  group_name: string | null;
  instructor: Instructor | null;
  grade: null | Grade;
  instructor_fee_percent: number;
};
