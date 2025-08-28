import type { Course } from "./courseTypes";
import type { Student } from "./studentTypes";

export type Enrollment = {
  id: number;
  suspended: boolean;
  left_course: boolean;
  created_at: string;
  updated_at: string;
  price_adjustments: null | EnrollmentPriceAdjustment;
  student_id: number;
  course_id: number;
  course: Course | null;
  student: Student | null;
  status: EnrollmentStatus[];
};

export type EnrollmentStatus = {
  type: "active" | "completed" | "pending" | "discontinued";
  reason: string | null;
  timestamp?: number;
};

export type EnrollmentPriceAdjustment = {
  type: "fixed" | "percentage" | "none";
  amount?: number;
  percentage?: number;
  reason: string;
};
