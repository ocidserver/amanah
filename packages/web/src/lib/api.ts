const API_URL = import.meta.env.VITE_API_URL ?? "/api"
const CACHE_KEY_PREFIX = "amanah-api-cache:"
const CACHE_TTL = 5 * 60 * 1000

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  retries?: number
  cache?: boolean
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

function getCachedData<T>(path: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + path)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY_PREFIX + path)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

function setCachedData<T>(path: string, data: T): void {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + path, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
  }
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

function getErrorMessage(status: number, serverError: string | undefined): string {
  const messages: Record<number, string> = {
    400: "Permintaan tidak valid",
    401: "Sesi berakhir, silakan masuk kembali",
    403: "Anda tidak memiliki akses",
    404: "Data tidak ditemukan",
    409: "Data sudah ada",
    429: "Terlalu banyak permintaan, coba beberapa saat lagi",
    500: "Terjadi kesalahan pada server",
    502: "Server tidak dapat dijangkau",
    503: "Server sedang tidak tersedia",
  }
  return serverError || messages[status] || `Terjadi kesalahan (${status})`
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options)
    if (response.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 1000 * (3 - retries)))
      return fetchWithRetry(url, options, retries - 1)
    }
    return response
  } catch (err) {
    if (retries > 0 && (err instanceof TypeError)) {
      await new Promise((r) => setTimeout(r, 1000 * (3 - retries)))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  }
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, retries = 2, cache = true } = options

  const token = getAccessToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  headers["Content-Type"] = "application/json"

  if (!navigator.onLine) {
    if (method === "GET" && cache) {
      const cached = getCachedData<T>(path)
      if (cached) return cached
    }
    throw new Error("Tidak ada koneksi internet")
  }

  let response: Response
  try {
    response = await fetchWithRetry(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }, retries)
  } catch {
    if (method === "GET" && cache) {
      const cached = getCachedData<T>(path)
      if (cached) return cached
    }
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
  }

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
        throw new Error(getErrorMessage(retryResponse.status, error.error))
      }

      const data = await retryResponse.json()
      if (method === "GET" && cache) {
        setCachedData(path, data)
      }
      return data
    }

    await clearTokens()
    window.location.href = "/login"
    throw new Error("Sesi berakhir, silakan masuk kembali")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: undefined }))
    throw new Error(getErrorMessage(response.status, error.error))
  }

  const data = await response.json()
  if (method === "GET" && cache) {
    setCachedData(path, data)
  }
  return data
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (!navigator.onLine) {
    throw new Error("Tidak ada koneksi internet")
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    })
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
  }

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      const retryResponse = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: "Network error" }))
        throw new Error(getErrorMessage(retryResponse.status, error.error))
      }

      return retryResponse.json()
    }

    await clearTokens()
    window.location.href = "/login"
    throw new Error("Sesi berakhir, silakan masuk kembali")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: undefined }))
    throw new Error(getErrorMessage(response.status, error.error))
  }

  return response.json()
}

export const api = {
  get: <T>(path: string, retries?: number) => apiRequest<T>(path, { retries }),
  post: <T>(path: string, body: unknown, retries?: number) => apiRequest<T>(path, { method: "POST", body, retries }),
  put: <T>(path: string, body: unknown, retries?: number) => apiRequest<T>(path, { method: "PUT", body, retries }),
  patch: <T>(path: string, body: unknown, retries?: number) => apiRequest<T>(path, { method: "PATCH", body, retries }),
  delete: <T>(path: string, retries?: number) => apiRequest<T>(path, { method: "DELETE", retries }),
  upload: <T>(path: string, formData: FormData) => apiUpload<T>(path, formData),
}

export { setTokens, clearTokens, getAccessToken }
export { API_URL }
