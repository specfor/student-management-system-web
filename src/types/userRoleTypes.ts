export type UserRole = {
  id: number;
  role_name: string;
  permissions: {
    [key: string]: string[];
  };
  dashboard_card_visibility: {
    [cardKey: string]: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type DashboardCard = {
  key: string;
  label: string;
};

