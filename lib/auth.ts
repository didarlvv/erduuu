"use client";

import axios from "axios";
import StorageService from "./storage";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface LoginResponse {
  payload: {
    id: number;
    is_super_user: boolean;
    status: string;
    roles: Array<{
      id: number;
      name: string;
      slug: string;
      permissions: Array<{
        id: number;
        name: string;
        slug: string;
      }>;
    }>;
    additional_permissions: any[];
    tokens: {
      access: {
        token: string;
        expires_in: string;
      };
      refresh: string;
    };
    phone: number;
    lang: string;
    first_name: string;
    last_name: string;
    created_at: string;
  };
  delay: number;
  timestamp: number;
}

interface ValidateTokenResponse {
  payload: {
    valid: boolean;
  };
  delay: number;
  timestamp: number;
}

interface RefreshTokenResponse {
  payload: {
    token: string;
    expires_in: string;
  };
  delay: number;
  timestamp: number;
}

// Update the login function
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_URL}/authentication/login`,
      {
        username,
        password,
      }
    );
    const data = response.data;
    StorageService.setItem("accessToken", data.payload.tokens.access.token);
    StorageService.setItem("refreshToken", data.payload.tokens.refresh);
    StorageService.setItem("userData", JSON.stringify(data.payload));
    StorageService.setItem(
      "permissions",
      JSON.stringify(data.payload.roles.flatMap((role) => role.permissions))
    );
    StorageService.setItem(
      "additionalPermissions",
      JSON.stringify(data.payload.additional_permissions)
    );
    // Remove the syncTokenWithCookie call
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
    throw error;
  }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await axios.post<ValidateTokenResponse>(
      `${API_URL}/authentication/validate/token`,
      {
        token,
      }
    );
    return response.data.payload.valid;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

export async function refreshToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const response = await axios.post<RefreshTokenResponse>(
      `${API_URL}/authentication/generate/token`,
      {
        token: refreshToken,
      }
    );
    return response.data.payload.token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Update the logout function
export function logout() {
  console.log("Logout function called in auth.ts");
  StorageService.removeItem("accessToken");
  StorageService.removeItem("refreshToken");
  StorageService.removeItem("userData");
  StorageService.removeItem("permissions");
  StorageService.removeItem("additionalPermissions");
  StorageService.removeItem("tokenValidationTimestamp");
  // Remove the syncTokenWithCookie call
  console.log("Local storage cleared");
}

// Добавим новую функцию для однократной валидации токена
export async function validateTokenOnce(): Promise<boolean> {
  const token = StorageService.getItem("accessToken");
  if (!token) return false;

  // Проверяем, была ли уже выполнена валидация
  const validationTimestamp = StorageService.getItem(
    "tokenValidationTimestamp"
  );
  if (validationTimestamp) {
    const now = Date.now();
    const lastValidation = Number.parseInt(validationTimestamp, 10);
    // Если прошло менее 5 минут с последней валидации, считаем токен валидным
    if (now - lastValidation < 5 * 60 * 1000) {
      return true;
    }
  }

  try {
    const isValid = await validateToken(token);
    if (isValid) {
      // Сохраняем временную метку валидации
      StorageService.setItem("tokenValidationTimestamp", Date.now().toString());
      return true;
    }

    // Если токен не валиден, пробуем обновить
    const refreshTokenValue = StorageService.getItem("refreshToken");
    if (refreshTokenValue) {
      const newAccessToken = await refreshToken(refreshTokenValue);
      if (newAccessToken) {
        StorageService.setItem("accessToken", newAccessToken);
        StorageService.setItem(
          "tokenValidationTimestamp",
          Date.now().toString()
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

// Изменим функцию isAuthenticated
export async function isAuthenticated(): Promise<boolean> {
  return await validateTokenOnce();
}

export function getUserData() {
  const userDataString = StorageService.getItem("userData");
  return userDataString ? JSON.parse(userDataString) ?? null : null;
}

export function getPermissions() {
  const permissionsString = StorageService.getItem("permissions");
  const additionalPermissionsString = StorageService.getItem(
    "additionalPermissions"
  );

  return [
    ...(JSON.parse(permissionsString ?? "[]") ?? []),
    ...(JSON.parse(additionalPermissionsString ?? "[]") ?? []),
  ];
}

// Function to create an axios instance with authentication
export function createAuthenticatedAxios() {
  const axiosInstance = axios.create({
    baseURL: API_URL,
  });

  axiosInstance.interceptors.request.use(async (config) => {
    const token = StorageService.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        // Токен истек или недействителен
        logout();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

// Remove the syncTokenWithCookie function
export function syncTokenWithCookie() {
  // This function is no longer needed
}
