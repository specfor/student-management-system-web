type Enrollment = {
  id: number;
  suspended: boolean;
  left_course: boolean;
  created_at: string;
  updated_at: string;
  price_adjustments: null | EnrollmentPriceAdjustment;
  course: Course | null;
  student: Student | null;
  status: EnrollmentStatus[];
};

type EnrollmentStatus = {
  type: "active" | "completed" | "pending" | "discontinued";
  reason: string | null;
};

type EnrollmentPriceAdjustment = {
  type: "fixed" | "percentage" | "none";
  amount?: number;
  percentage?: number;
  reason: string;
};
