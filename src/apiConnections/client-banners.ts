import {
  sendDeleteRequest,
  sendFileDownloadRequest,
  sendFileUploadRequest,
  sendGetRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
} from "@/utils/requests";

export async function getClientBanners(
  startIndex = 0,
  limit: null | number = null,
  options?: {
    filters?: {
      active?: boolean;
    };
    sort?: {
      by: "updated_at" | "id";
      direction: "asc" | "desc";
    };
  }
) {
  const params: { [key: string]: any } = { start: startIndex };
  if (limit) params["size"] = limit;
  if (options?.sort) {
    params.sort = options.sort.by;
    params.sort_dir = options.sort.direction;
  }
  if (options?.filters) {
    if (options.filters.active !== undefined) {
      params.active = options.filters.active;
    }
  }
  return sendGetRequest("/banners", params);
}

export async function createBanner(imageId: string, seconds_to_show: number) {
  return sendJsonPostRequest("/banners", {
    image: imageId,
    seconds_to_show: seconds_to_show,
  });
}

export async function updateBanner(id: number, seconds_to_show: number, active: boolean) {
  return sendJsonPatchRequest(`/banners/${id}`, {
    seconds_to_show: seconds_to_show,
    active: active,
  });
}

export async function deleteBanner(id: number) {
  return sendDeleteRequest(`/banners/${id}`);
}

export async function uploadBannerImage(file: Blob) {
  return sendFileUploadRequest("/banners/image", "image", file);
}

export async function downloadBannerImage(bannerID: number) {
  return sendFileDownloadRequest(`/banners/${bannerID}/image`);
}
