export type ClientBanner = {
  id: number;
  type: "image" | "video";
  media: string;
  seconds_to_show: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy support for old image field
  image?: string;
};
