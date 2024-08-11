export type UserRole = {
  id: number;
  role_name: string;
  permissions: {
    [key: string]: string[];
  };
  created_at: string;
  updated_at: string;
};
