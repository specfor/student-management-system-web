export type StudentPaymentBill = {
  id: number;
  student_id: number;
  status: "pending" | "cancelled" | "printed";
  payment_ids: Array<number>;
  created_at: string;
  updated_at: string;
  student_name: string;
  student_custom_id: string;
  total: string;
  payment_data: {
    payment_id: {
      courseName: string;
      paymentFor: string;
      amount: string;
    };
  };
};
