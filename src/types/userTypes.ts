import type { UserRole } from "./userRoleTypes";

export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: null | string;
  created_at: string;
  updated_at: string;
  role: UserRole;
};
