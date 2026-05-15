const API_URL = import.meta.env.VITE_API_URL ?? "/api"

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

function getAccessToken(): string | null {
  return localStorage.getItem("auth_access_token")
}

function getRefreshToken(): string | null {
  return localStorage.getItem("auth_refresh_token")
}

async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  localStorage.setItem("auth_access_token", accessToken)
  localStorage.setItem("auth_refresh_token", refreshToken)
}

async function clearTokens(): Promise<void> {
  localStorage.removeItem("auth_access_token")
  localStorage.removeItem("auth_refresh_token")
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        await clearTokens()
        return null
      }

      const data = await response.json()
      await setTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    } catch {
      await clearTokens()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const token = getAccessToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  headers["Content-Type"] = "application/json"

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      const retryResponse = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: "Network error" }))
        throw new Error(error.error ?? `API error: ${retryResponse.status}`)
      }

      return retryResponse.json()
    }

    await clearTokens()
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Network error" }))
    throw new Error(error.error ?? `API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
}

export { setTokens, clearTokens, getAccessToken }
export { API_URL }