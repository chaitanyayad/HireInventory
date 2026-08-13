import { api } from './client'
import type {
  Application,
  ApplicationCreate,
  CoverLetterRequest,
  DashboardStats,
  InsightResponse,
  InterviewPrepRequest,
  InterviewPrepResponse,
  Status,
  Token,
  User,
} from './types'

/** POST /auth/* — routers/auth.py */
export const auth = {
  register: (email: string, password: string) =>
    api.post<User>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
}

/** /applications — routers/application.py */
export const applications = {
  // The backend caps this at 50 rows (application_service.list_applications
  // defaults limit=50) and exposes no page param, so this is the first page
  // and only page. Filtering in the UI is over these 50.
  list: () => api.get<Application[]>('/applications'),
  get: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (data: ApplicationCreate) =>
    api.post<Application>('/applications', data),
  updateStatus: (id: string, status: Status) =>
    api.patch<Application>(`/applications/${id}/status`, { status }),
  remove: (id: string) => api.delete<void>(`/applications/${id}`),
}

/** GET /dashboard/stats — Redis-cached, invalidated on every write */
export const dashboard = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
}

/** /ai — routers/ai.py. All three share one 10/hour per-user budget. */
export const ai = {
  analyze: () => api.post<InsightResponse>('/ai/analyze'),
  coverLetter: (data: CoverLetterRequest) =>
    api.post<{ content: string }>('/ai/cover-letter', data),
  interviewPrep: (data: InterviewPrepRequest) =>
    api.post<InterviewPrepResponse>('/ai/interview-prep', data),
}
