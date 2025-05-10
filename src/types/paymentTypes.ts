import type { APIMoney } from "./analytics";
import type { CourseFee } from "./courseTypes";
import type { Enrollment } from "./enrollmentTypes";
import type { Instructor } from "./InstructorTypes";

export type StudentPayment = {
  id: number;
  payment_method: "cash" | "card";
  amount: number;
  payment_for: "onetime" | string;
  refunded: boolean;
  refund_reason: null | string;
  created_at: string;
  updated_at: string;
  enrollment_id: number;
  enrollment?: Enrollment;
  custom_amount_reason: null | string;
  bill_id: number | null;
};

// used in instructor payments calculation and things

export type InstructorPayment = {
  id: number;
  instructor_id: number;
  paid_month: string;
  tot_amount: APIMoney;
  tot_pending_amount: APIMoney;
  pending_payments_resolved: boolean;
  enrollment_ids_for_pending_payments: null | number[];
  payment_ids: null | number[];
  created_at: string;
  updated_at: string;
  instructor: Instructor;
};

export type StudentPaymentListItem = {
  student_id: number;
  attended_day_count: number;
  payment_amount: APIMoney;
  payment_id: number | null;
  enrollment_id: number | null;
  paid_date: string | null;
  paid_instructor_share: boolean;
  month: string;
};

export type StudentPaymentListingResponse = {
  for_selected_month: {
    course_id: number;
    course_name: string;
    course_fee: CourseFee;
    instructor_fee_percentage: number;
    enrollment_count: number;
    collected_payment_amount: APIMoney;
    estimated_payment_amount: APIMoney;
    collected_instructors_payment_amount: APIMoney;
    estimated_instructors_payment_amount: APIMoney;
    records: StudentPaymentListItem[];
  }[];
  for_other_months: {
    course_id: number;
    course_name: string;
    course_fee: CourseFee;
    instructor_fee_percentage: number;
    enrollment_count: number;
    records: StudentPaymentListItem[];
  }[];
  relation_data: {
    students: {
      id: number;
      name: string;
      custom_id: string;
    }[];
  };
};

export type InstructorPaymentSummary = {
  id: number;
  name: string;
  total_paid: APIMoney;
  total_payable: APIMoney;
  max_payment: APIMoney;
  count_payments_resolved: number;
  count_payments_unresolved: number;
  coursewise?: {
    course_name: string;
    total_paid: APIMoney;
    total_payable: APIMoney;
    max_payment: APIMoney;
    count_payments_resolved: number;
    count_payments_unresolved: number;
  }[];
}[];
