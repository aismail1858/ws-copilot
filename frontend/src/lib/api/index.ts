class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(detail.detail || res.statusText, res.status);
  }

  return res.json();
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>("GET", endpoint),
  post: <T>(endpoint: string, data?: unknown) => request<T>("POST", endpoint, data),
  patch: <T>(endpoint: string, data?: unknown) => request<T>("PATCH", endpoint, data),
  put: <T>(endpoint: string, data?: unknown) => request<T>("PUT", endpoint, data),
  delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),
  getBlob: async (endpoint: string) => {
    const res = await fetch(endpoint, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch blob");
    return res.blob();
  },
  uploadToS3: async (url: string, file: File) => {
    const res = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("Failed to upload to S3");
  },
};