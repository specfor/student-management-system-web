type Enrollment = {
  id: number;
  suspended: boolean;
  left_course: boolean;
  created_at: string;
  updated_at: string;
  price_adjustments: null | EnrollmentPriceAdjustment;
  course: Course;
  student: Student;
};

type EnrollmentPriceAdjustment = {
  type: "fixed" | "percentage";
  amount?: number;
  percentage?: number;
  reason: string;
};
