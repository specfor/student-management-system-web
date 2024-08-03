type StudentPayment = {
  id: number;
  payment_method: "cash" | "card";
  amount: number;
  payment_for: "onetime" | string;
  refunded: boolean;
  refund_reason: null | string;
  created_at: string;
  updated_at: string;
  enrollment: Enrollment;
};
