// API Service - src/services/api.ts
// Base URL: http://127.0.0.1:8000/api

const API_BASE_URL = "http://127.0.0.1:8000/api"

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = API_BASE_URL + endpoint
  const token = getSessionToken()
  const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeader,
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    })
  } catch (_networkErr) {
    throw new Error("Unable to connect to the server. Please try again.")
  }

  if (!response.ok) {
    let msg = "HTTP " + response.status + ": " + response.statusText
    let errors: Record<string, string[]> | undefined
    try {
      const body = await response.json()
      if (body?.errors && typeof body.errors === "object") {
        errors = body.errors
        const firstFieldErrors = Object.values(body.errors)[0]
        if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
          msg = firstFieldErrors[0]
        } else if (body.message) {
          msg = body.message
        }
      } else if (body?.message) {
        msg = body.message
      }
    } catch (_e) {}
    throw new ApiError(msg, response.status, errors)
  }

  return response.json() as Promise<T>
}

// -----------------------------------------------------------------
// Test endpoint (Phase 1)
// -----------------------------------------------------------------
export interface TestBackendResponse {
  message: string
}

export async function testBackend(): Promise<TestBackendResponse> {
  return apiFetch<TestBackendResponse>("/test")
}

// -----------------------------------------------------------------
// Registration endpoint (Phase 4 / Phase 6)
// -----------------------------------------------------------------
export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: "user" | "admin"
  user_type: string
}

export interface RegisterResponse {
  message: string
  token?: string
  access_key?: string
  user: AuthUser
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// -----------------------------------------------------------------
// Login endpoint (Phase 5 / Phase 7)
// -----------------------------------------------------------------
export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  user_type: string
  access_key?: string
}

export interface LoginResponse {
  message: string
  token: string
  user: AuthUser
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// -----------------------------------------------------------------
// Access key verification & management endpoints
// -----------------------------------------------------------------
export interface AccessKeyVerifyResponse {
  message: string
  user: AuthUser
}

export interface AccessKeyResponse {
  message: string
  access_key: string
  user?: AuthUser
}

export async function verifyAccessKey(
  access_key: string,
): Promise<AccessKeyVerifyResponse> {
  return apiFetch<AccessKeyVerifyResponse>("/access-key/verify", {
    method: "POST",
    body: JSON.stringify({
      access_key,
    }),
  })
}

export async function getAdminAccessKey(): Promise<AccessKeyResponse> {
  return apiFetch<AccessKeyResponse>("/access-key", {
    method: "GET",
  })
}

export async function generateAdminAccessKey(): Promise<AccessKeyResponse> {
  return apiFetch<AccessKeyResponse>("/access-key/generate", {
    method: "POST",
  })
}

// -----------------------------------------------------------------
// Connection requests endpoint (Phase 10 / Phase 11 / Phase 12 / Phase 13)
// -----------------------------------------------------------------
export interface ConnectionUser {
  id: number
  name: string
  email?: string
  role: string
  user_type: string
}

export interface Connection {
  id: number
  requester_id: number
  supporter_id: number
  status: "pending" | "accepted" | "rejected" | "revoked"
  allow_mood: boolean
  allow_stress: boolean
  allow_sleep: boolean
  allow_energy: boolean
  created_at?: string
  updated_at?: string
  requester?: ConnectionUser
  supporter?: ConnectionUser
}

export interface ConnectionsResponse {
  connections: Connection[]
}

export interface UpdateConnectionPermissionsPayload {
  allow_mood?: boolean
  allow_stress?: boolean
  allow_sleep?: boolean
  allow_energy?: boolean
}

export interface UpdateConnectionPermissionsResponse {
  message: string
  connection: Connection
}

export interface CreateConnectionPayload {
  supporter_id: number
  allow_mood: boolean
  allow_stress: boolean
  allow_sleep: boolean
  allow_energy: boolean
}

export interface CreateConnectionResponse {
  message: string
  connection: Connection
}

export async function createConnection(
  payload: CreateConnectionPayload,
): Promise<CreateConnectionResponse> {
  return apiFetch<CreateConnectionResponse>("/connections", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export type IncomingConnection = Connection & { requester?: AuthUser }

export interface IncomingConnectionsResponse {
  message: string
  connections: IncomingConnection[]
}

export interface ConnectionActionResponse {
  message: string
  connection: Connection
}

export async function getConnections(): Promise<ConnectionsResponse> {
  return apiFetch<ConnectionsResponse>("/connections", {
    method: "GET",
  })
}

export async function updateConnectionPermissions(
  connectionId: number,
  payload: UpdateConnectionPermissionsPayload,
): Promise<UpdateConnectionPermissionsResponse> {
  return apiFetch<UpdateConnectionPermissionsResponse>(
    `/connections/${connectionId}/permissions`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  )
}

export async function getIncomingConnections(): Promise<IncomingConnectionsResponse> {
  return apiFetch<IncomingConnectionsResponse>("/connections/incoming", {
    method: "GET",
  })
}

export async function acceptConnection(
  connectionId: number,
): Promise<ConnectionActionResponse> {
  return apiFetch<ConnectionActionResponse>(`/connections/${connectionId}/accept`, {
    method: "POST",
  })
}

export async function rejectConnection(
  connectionId: number,
): Promise<ConnectionActionResponse> {
  return apiFetch<ConnectionActionResponse>(`/connections/${connectionId}/reject`, {
    method: "POST",
  })
}

export async function revokeConnection(
  connectionId: number,
): Promise<ConnectionActionResponse> {
  return apiFetch<ConnectionActionResponse>(`/connections/${connectionId}/revoke`, {
    method: "POST",
  })
}

// -----------------------------------------------------------------
// Check-In & Pattern Analysis Endpoints (Phase 16)
// -----------------------------------------------------------------
export interface CheckInRatingsPayload {
  mood: number
  energy: number
  focus: number
  stress: number
  sleep: number
}

export interface CheckInRecord {
  id: number
  user_id: number
  mood: number
  energy: number
  focus: number
  stress: number
  sleep: number
  created_at: string
  formatted_date: string
  date_short: string
  day_of_week: string
}

export interface StateSummary {
  state: "low" | "neutral" | "positive"
  title: string
  message: string
  quote: string
  badgeText: string
  badgeColor: "coral" | "lavender" | "mint"
  characterMood: string
  overall_score: number
}

export interface CheckInResponse {
  success: boolean
  message: string
  check_in: CheckInRecord
  timestamp: string
  summary?: StateSummary
}

export interface PatternAverages {
  mood: number | null
  energy: number | null
  focus: number | null
  stress: number | null
  sleep: number | null
}

export interface PatternChanges {
  mood: number | null
  energy: number | null
  focus: number | null
  stress: number | null
  sleep: number | null
}

export interface PatternTrends {
  mood: "improving" | "declining" | "stable" | "insufficient_data"
  energy: "improving" | "declining" | "stable" | "insufficient_data"
  focus: "improving" | "declining" | "stable" | "insufficient_data"
  stress: "improving" | "declining" | "stable" | "insufficient_data"
  sleep: "improving" | "declining" | "stable" | "insufficient_data"
}

export interface PatternAnalysisResponse {
  success: boolean
  period: string
  total_check_ins: number
  total_historical_check_ins: number
  latest_check_in: CheckInRecord | null
  averages: PatternAverages
  changes: PatternChanges
  trends: PatternTrends
  comparison_period: {
    has_comparison: boolean
    type: string
    previous_averages: PatternAverages | null
  }
  observations: string[]
  time_series: CheckInRecord[]
  has_sufficient_data: boolean
}

export async function submitCheckIn(
  payload: CheckInRatingsPayload,
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>("/check-ins", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function fetchPatterns(
  period: "7d" | "30d" | "90d" | "all" = "7d",
): Promise<PatternAnalysisResponse> {
  return apiFetch<PatternAnalysisResponse>(`/patterns?period=${encodeURIComponent(period)}`, {
    method: "GET",
  })
}

export async function fetchCheckIns(): Promise<{ success: boolean; check_ins: CheckInRecord[] }> {
  return apiFetch<{ success: boolean; check_ins: CheckInRecord[] }>("/check-ins", {
    method: "GET",
  })
}

// -----------------------------------------------------------------
// Chatbot / Gemini endpoint (Phase 2)
// -----------------------------------------------------------------
export interface ChatMessageItem {
  role: "user" | "assistant" | "model"
  content: string
}

export interface ChatResponse {
  success: boolean
  reply: string
  source?: string
  timestamp: string
}

export async function sendChatMessage(
  message: string,
  history: ChatMessageItem[] = [],
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      history: history.map((item) => ({
        role: item.role === "assistant" ? "model" : item.role,
        content: item.content,
      })),
    }),
  })
}

// -----------------------------------------------------------------
// Reports endpoint (Phase 5)
// -----------------------------------------------------------------
export interface DimensionReport {
  dimension: string
  label: string
  color: string
  average: number | null
  change: number | null
  trend: string
  state: string
  arrow: string
}

export interface SharedUserReport {
  connection_id: number
  student_id: number
  student_name: string
  relationship: string
  report: UserReportResponse
  permitted_dimensions: string[]
}

export interface UserReportResponse {
  success: boolean
  period: string
  period_label: string
  status_badge: string
  user_name: string
  total_check_ins: number
  latest_check_in: CheckInRecord | null
  dimension_reports: DimensionReport[]
  time_series: CheckInRecord[]
  insights: string[]
  has_sufficient_data: boolean
  generated_at: string
  shared_reports?: SharedUserReport[]
}

export async function fetchReports(
  period: "7d" | "30d" | "90d" | "all" = "30d",
  admin: boolean = false,
): Promise<UserReportResponse> {
  const query = new URLSearchParams({ period })
  if (admin) query.set("admin", "1")
  return apiFetch<UserReportResponse>(`/reports?${query.toString()}`, {
    method: "GET",
  })
}

// -----------------------------------------------------------------
// System Status / Truthful Health endpoint (Phase 8)
// -----------------------------------------------------------------
export interface SystemStatusResponse {
  status: "operational" | "degraded" | "unavailable"
  backend: string
  database: string
  gemini_service: string
  check_ins_service: string
  patterns_service: string
  reports_service: string
  timestamp: string
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  return apiFetch<SystemStatusResponse>("/status", {
    method: "GET",
  })
}

// -----------------------------------------------------------------
// User Profile & Settings endpoints (Phase 17)
// -----------------------------------------------------------------
export interface NotificationPreferences {
  daily_reminder?: boolean
  weekly_report?: boolean
  pattern_alerts?: boolean
  reminder_time?: string
  email_notifications?: boolean
  checkin_reminders?: boolean
  weekly_insights?: boolean
  supporter_alerts?: boolean
}

export interface PrivacySettings {
  share_mood?: boolean
  share_stress?: boolean
  share_sleep?: boolean
  share_energy?: boolean
  allow_circle_requests?: boolean
  share_checkins?: boolean
  share_patterns?: boolean
  anonymous_analytics?: boolean
  allow_supporter_view?: boolean
}

export interface UserProfileResponse {
  success: boolean
  user: AuthUser & {
    notification_preferences?: NotificationPreferences
    privacy_settings?: PrivacySettings
    created_at?: string
  }
  notification_preferences?: NotificationPreferences
  privacy_settings?: PrivacySettings
  stats: {
    total_check_ins: number
    active_connections: number
  }
}

export async function fetchProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>("/profile", {
    method: "GET",
  })
}

export async function updateProfile(data: {
  name?: string
  email?: string
  notification_preferences?: Partial<NotificationPreferences>
  privacy_settings?: Partial<PrivacySettings>
}): Promise<{ success: boolean; message: string; user: AuthUser }> {
  return apiFetch<{ success: boolean; message: string; user: AuthUser }>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function changePassword(data: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/profile/password", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  try {
    return await apiFetch<{ success: boolean; message: string }>("/profile/logout", {
      method: "POST",
    })
  } catch {
    return { success: true, message: "Logged out locally." }
  } finally {
    clearSessionAuth()
  }
}

export async function fetchProfileCheckIns(): Promise<{
  success: boolean
  total: number
  check_ins: CheckInRecord[]
}> {
  return apiFetch<{ success: boolean; total: number; check_ins: CheckInRecord[] }>("/profile/check-ins", {
    method: "GET",
  })
}

// -----------------------------------------------------------------
// Wellness Activities & Journaling endpoints (Phase 17)
// -----------------------------------------------------------------
export interface ActivityLogPayload {
  activity_type: "breathe" | "walk" | "grounding" | "stretch" | "journal" | "music" | "hydrate"
  duration_seconds: number
  completed?: boolean
  feeling?: string
  notes?: string
}

export async function logActivity(data: ActivityLogPayload): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/activities/log", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export interface JournalEntryItem {
  id: number
  prompt: string
  content: string
  created_at: string
  formatted_date: string
}

export async function saveJournalEntry(data: {
  prompt?: string
  content: string
}): Promise<{ success: boolean; message: string; entry: JournalEntryItem }> {
  return apiFetch<{ success: boolean; message: string; entry: JournalEntryItem }>("/journal", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function fetchJournalEntries(): Promise<{
  success: boolean
  entries: JournalEntryItem[]
}> {
  return apiFetch<{ success: boolean; entries: JournalEntryItem[] }>("/journal", {
    method: "GET",
  })
}

// -----------------------------------------------------------------
// Spotify & Music endpoints (Phase 17)
// -----------------------------------------------------------------
export interface SpotifyTrack {
  id: string
  title: string
  artist: string
  album: string
  album_art: string | null
  duration_ms: number
  preview_url: string | null
  spotify_url: string
  uri: string
  tags?: string[]
  has_preview?: boolean
}

export interface SpotifyStatusResponse {
  success: boolean
  configured: boolean
  token_valid: boolean
  catalog_access: string
  playback_support: string
  message: string
}

export interface MusicTracksResponse {
  success: boolean
  source: string
  note?: string
  intent: string
  genres: string[]
  tracks: SpotifyTrack[]
}

export async function fetchSpotifyStatus(): Promise<SpotifyStatusResponse> {
  return apiFetch<SpotifyStatusResponse>("/music/status", {
    method: "GET",
  })
}

export async function fetchMusicTracks(intent = "relax", genres: string[] = []): Promise<MusicTracksResponse> {
  const query = new URLSearchParams({ intent })
  if (genres.length > 0) {
    query.set("genres", genres.join(","))
  }
  return apiFetch<MusicTracksResponse>(`/music/tracks?${query.toString()}`, {
    method: "GET",
  })
}

export async function fetchMusicPreferences(): Promise<{
  success: boolean
  preferences: { intent: string; genres: string[] }
}> {
  return apiFetch<{ success: boolean; preferences: { intent: string; genres: string[] } }>("/music/preferences", {
    method: "GET",
  })
}

export async function updateMusicPreferences(data: {
  intent: string
  genres: string[]
}): Promise<{ success: boolean; message: string; preferences: { intent: string; genres: string[] } }> {
  return apiFetch<{ success: boolean; message: string; preferences: { intent: string; genres: string[] } }>("/music/preferences", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}



// Session token helpers (sessionStorage only, as per Phase 7)
const TOKEN_KEY = "echo_auth_token"
const USER_KEY = "echo_auth_user"

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionAuth(token: string, user: AuthUser): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {}
}

export function getSessionUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSessionAuth(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  } catch {}
}

// -----------------------------------------------------------------
// Normalized helpers & In-memory signup draft (no storage persistence)
// -----------------------------------------------------------------
export function normalizeUserType(rawType: string): string {
  const lower = rawType.toLowerCase().trim()
  if (lower.startsWith("student")) return "student"
  if (lower.startsWith("employee")) return "employee"
  if (lower.startsWith("general") || lower === "other") return "general"
  if (lower.startsWith("child")) return "children"
  if (
    lower.startsWith("teacher") ||
    lower.startsWith("mentor") ||
    lower.startsWith("counsellor")
  )
    return "teacher"
  if (lower.startsWith("parent")) return "parent"
  if (lower.startsWith("organization") || lower.startsWith("administrator"))
    return "organization"
  return "student"
}

export interface SignupDraft {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: "user" | "admin"
  user_type: string
  error?: string
}

let inMemorySignupDraft: SignupDraft = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: "user",
  user_type: "student",
}

export function getSignupDraft(): SignupDraft {
  return inMemorySignupDraft
}

export function updateSignupDraft(updates: Partial<SignupDraft>): void {
  inMemorySignupDraft = { ...inMemorySignupDraft, ...updates }
}

export function clearSensitiveSignupDraft(): void {
  inMemorySignupDraft.password = ""
  inMemorySignupDraft.password_confirmation = ""
}
