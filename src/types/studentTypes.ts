import type { Grade } from "./gradeTypes";

export type Student = {
  id: number;
  name: string;
  full_name: string | null;
  birthday: string | null;
  image: string | null;
  school: string | null;
  email: string | null;
  address: string | null;
  phone_number: string | null;
  parent_name: string | null;
  parent_phone_number: string | null;
  created_at: string;
  updated_at: string;
  custom_id?: string;
  grade: Grade | null;
  admission_paid: boolean;
  fingerprint?: boolean;
  rfid?: string;
  trust_score?: number;
  payment_override_week?: number | null;
  payment_override_expires_at?: string | null;
  payment_week_tendency?: {
    week_1: number;
    week_2: number;
    week_3: number;
    week_4: number;
    primary_week: string;
  };
};

export type AdmissionFee = {
  id: number;
  student_id: number;
  amount: number;
  paid: boolean;
  created_at: string;
  updated_at: string;
  reductions: null | string;
};

export type TemporaryStudent = {
  id: number;
  name: string;
  phone_number: string | null;
  grade_id: number | null;
  grade: Grade | null;
  registration_fee: string | number;
  fee_paid: boolean;
  notes: string | null;
  converted: boolean;
  converted_student_id: number | null;
  created_at: string;
  updated_at: string;
};
