import { useHeaderStore } from "@/stores/headers";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export async function sendJsonPostRequest(
  url: string,
  jsonBody: any,
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };
  headers_["Content-Type"] = "application/json";

  let response = null;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: headers_,
      body: JSON.stringify(jsonBody),
      credentials: "same-origin",
    });
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}

export async function sendGetRequest(
  url: string,
  params = {},
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };
  let response = null;
  try {
    if (params) url = url + "?" + new URLSearchParams(params);
    response = await fetch(url, {
      method: "GET",
      headers: headers_,
      credentials: "same-origin",
    });
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}

export async function sendDeleteRequest(
  url: string,
  jsonBody?: any,
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };
  headers_["Content-Type"] = "application/json";

  let response = null;
  try {
    const body: RequestInit = {
      method: "DELETE",
      headers: headers_,
      credentials: "same-origin",
    };
    if (jsonBody) body["body"] = JSON.stringify(jsonBody);

    response = await fetch(url, body);
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}

export async function sendJsonPatchRequest(
  url: string,
  jsonBody = {},
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };
  headers_["Content-Type"] = "application/json";

  let response = null;
  try {
    response = await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(jsonBody),
      headers: headers_,
      credentials: "same-origin",
    });
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}

export async function sendFileDownloadRequest(
  url: string,
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };

  let response = null;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: headers_,
      credentials: "same-origin",
    });
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  if (response.status === 200)
    return {
      status: "success",
      data: { file: await response.blob() },
      message: "Succssfully downloaded the file.",
    };

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}

export async function sendFileUploadRequest(
  url: string,
  formName: string,
  formValue: string | Blob,
  headers = {},
  useBaseUrl = true
) {
  if (useBaseUrl) {
    url = baseUrl + url;
  }
  let headers_ = useHeaderStore().getHeaders();
  headers_ = { ...headers_, ...headers };

  const formData = new FormData();
  formData.append(formName, formValue);

  let response = null;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: headers_,
      body: formData,
      credentials: "same-origin",
    });
  } catch (e) {
    return {
      status: "error",
      message: "Failed to connect to the servers.",
      data: null,
    };
  }

  if (response.status === 200)
    return {
      status: "success",
      data: { file: await response.blob() },
      message: "Succssfully downloaded the file.",
    };

  let data_;
  try {
    data_ = await response.json();
    return {
      status: data_.status,
      data: data_.data ?? data_.error,
      message: data_.message ?? null,
    };
  } catch (error) {
    return { status: "error", message: "Something went wrong.", data: null };
  }
}
