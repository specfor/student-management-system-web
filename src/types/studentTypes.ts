type Student = {
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
};
