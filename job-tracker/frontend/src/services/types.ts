/**
 * Mirrors the Pydantic schemas in backend/app/schemas/. If you change one of
 * those, change this — nothing generates these types, so they drift silently.
 */

/** backend/app/models/application.py :: ApplicationStatus */
export const STATUSES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
] as const

export type Status = (typeof STATUSES)[number]

/** Ordered by pipeline position, which is how the dashboard band segments. */
export const STATUS_ORDER: Status[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
]

export interface User {
  id: string
  email: string
}

export interface Token {
  access_token: string
  token_type: string
}

/** schemas/application.py :: ApplicationResponse */
export interface Application {
  id: string
  user_id: string
  company_name: string
  role: string
  job_link: string | null
  date_applied: string // ISO date, no time
  status: Status
  notes: string | null
  interview_date: string | null
  created_at: string
  updated_at: string
}

/** schemas/application.py :: ApplicationCreate */
export interface ApplicationCreate {
  company_name: string
  role: string
  job_link?: string | null
  date_applied: string
  notes?: string | null
  interview_date?: string | null
}

/** services/dashboard_service.py :: compute_stats */
export interface DashboardStats {
  total: number
  by_status: Record<Status, number>
  response_rate: number
}

export interface InsightResponse {
  insight: string
  applications_analyzed: number
}

export interface CoverLetterRequest {
  company_name: string
  role: string
  skills: string
}

export interface InterviewPrepRequest {
  application_id?: string
  company_name?: string
  role?: string
}

export interface InterviewPrepResponse {
  company_name: string
  role: string
  prep: string
}

/** websockets/status_ws.py + services/application_service.py */
export type SocketEvent =
  | { event_type: 'connected'; user_id: string }
  | { event_type: 'pong' }
  | {
      event_type: 'status_changed'
      application_id: string
      user_id: string
      company_name: string
      role: string
      old_status: Status
      new_status: Status
    }
