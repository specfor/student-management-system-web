import type { CourseFee } from "./courseTypes";

export type AnalyticsInstructorMonthlyPaymentCalculation = {
  overall: {
    payments: {
      total: APIMoney;
      instructor_share: APIMoney;
      class_share: APIMoney;
    };
  };
  for_selected_month: AnalyticsPaymentRecord[];
  for_other_months: AnalyticsPaymentRecord[];
  relation_data: {
    students: {
      id: number;
      name: string;
      custom_id: string | null;
    }[];
  };
};

export type AnalyticsPaymentRecord = {
  course_id: number;
  course_name: string;
  course_fee: CourseFee;
  tot_payments: APIMoney;
  instructor_share: APIMoney;
  class_share: APIMoney;
  instructor_fee_percentage: number;
  enrollment_count: number;
  records: {
    student_id: number;
    attended_day_count: number;
    payment_amount: string;
    instructor_share: APIMoney;
    class_share: APIMoney;
    month: string;
  }[];
};

export type AnalyticsStudentMonthlyPaymentSummary = {
  summary: {
    instructor_id: number;
    instructor_name: string;
    collected_payment_amount: APIMoney;
    estimated_payment_amount: APIMoney;
    collected_instructors_payment_amount: APIMoney;
    estimated_instructors_payment_amount: APIMoney;
    coursewise_payment_summary: {
      course_id: number;
      course_name: string;
      enrollment_count: number;
      collected_payment_amount: APIMoney;
      estimated_payment_amount: APIMoney;
      collected_instructors_payment_amount: APIMoney;
      estimated_instructors_payment_amount: APIMoney;
    }[];
  }[];
};

export type APIMoney = {
  amount: string;
  currency: string;
};
