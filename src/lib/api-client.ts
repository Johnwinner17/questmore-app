/**
 * QuestMore Unified API Client connecting Next.js Frontend to Django Backend / REST APIs
 */

const DJANGO_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("questmore_jwt_access");
};

export const setAuthTokens = (access: string, refresh?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("questmore_jwt_access", access);
  if (refresh) localStorage.setItem("questmore_jwt_refresh", refresh);
};

export const clearAuthTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("questmore_jwt_access");
  localStorage.removeItem("questmore_jwt_refresh");
  localStorage.removeItem("questmore_user");
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Determine base url (Django backend if configured, else relative Next.js route)
  const baseUrl = DJANGO_URL ? DJANGO_URL.replace(/\/$/, "") : "";
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Token expired, clear auth if on authenticated endpoint
      console.warn("API 401 Unauthorized:", endpoint);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`API Fetch Error on ${endpoint}:`, error);
    throw error;
  }
}

export const QuestMoreAPI = {
  // ─── Authentication ───
  googleAuth: async (payload: {
    credential?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    picture?: string;
    phone?: string;
    location?: string;
    address?: string;
  }) => {
    return apiFetch<{ success: boolean; user: any; tokens?: { access: string; refresh: string } }>(
      "/api/auth/client",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  getProfile: async () => {
    return apiFetch<any>("/api/auth/client");
  },

  updateProfile: async (data: any) => {
    return apiFetch<any>("/api/auth/client", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // ─── Catalogue ───
  getCategories: async () => {
    return apiFetch<any[]>("/api/categories");
  },

  getServicesByCategory: async (categoryId: number) => {
    return apiFetch<any[]>(`/api/services/by-category?categoryId=${categoryId}`);
  },

  getAllServices: async () => {
    return apiFetch<any[]>("/api/services/all");
  },

  getGallery: async (featuredOnly = false) => {
    return apiFetch<any[]>(`/api/gallery${featuredOnly ? "?featured=true" : ""}`);
  },

  // ─── Cart ───
  getCart: async () => {
    return apiFetch<any>("/api/cart");
  },

  addToCart: async (serviceId: number) => {
    return apiFetch<any>("/api/cart", {
      method: "POST",
      body: JSON.stringify({ service_id: serviceId }),
    });
  },

  removeFromCart: async (serviceId?: number) => {
    return apiFetch<any>("/api/cart", {
      method: "DELETE",
      body: JSON.stringify({ service_id: serviceId }),
    });
  },

  // ─── Service Requests & Orders ───
  submitRequest: async (payload: any) => {
    return apiFetch<any>("/api/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getUserRequests: async (email?: string) => {
    return apiFetch<any[]>(`/api/requests${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  },

  confirmJobCompletion: async (requestId: number) => {
    return apiFetch<any>("/api/request", {
      method: "PUT",
      body: JSON.stringify({ action: "confirm_completion", requestId }),
    });
  },
};
