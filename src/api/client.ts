import type {
  CorrelativeYearItem,
  CreateProcedureResponse,
  IdentityDocumentTypeListItem,
  LoginResponse,
  PresentedDocumentTypeListItem,
  ProcedureDetail,
  ProcedureListItem,
  ProcedureStatus,
  ProcedureTypeListItem,
  ProgramListItem,
  PublicProcedureResult,
  Shift,
  StudentListItem,
  UserListItem,
  UserProfile,
} from '../types/domain';

// All requests go to a relative "/api/..." path:
//  - In dev, Vite's proxy (vite.config.ts) forwards it to the local API.
//  - In production, frontend (Vercel) and backend (SmarterASP.NET) are
//    always on separate hosts, so VITE_API_BASE_URL is required at build
//    time — see README.md "Deploying to Vercel".
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const TOKEN_KEY = 'tramites_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    if (!path.startsWith('/auth/login')) {
      window.location.href = '/login';
    }
  }

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ?? 'Ocurrió un error inesperado.';
    throw new ApiError(message, res.status);
  }

  return body as T;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (usable.length === 0) return '';
  return '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const api = {
  auth: {
    login: (dni: string, password: string) =>
      post<LoginResponse>('/auth/login', { dni, password }),
    me: () => get<UserProfile>('/auth/me'),
  },

  users: {
    list: () => get<UserListItem[]>('/users'),
    create: (data: { name: string; dni: string; password: string; role: string }) =>
      post<UserListItem>('/users', data),
    update: (id: number, data: { name: string; dni: string; role: string; isActive: boolean; password?: string | null }) =>
      put<UserListItem>(`/users/${id}`, data),
  },

  programs: {
    list: (onlyActive = false) => get<ProgramListItem[]>(`/programs${qs({ onlyActive })}`),
    create: (data: { code: string; name: string }) => post<ProgramListItem>('/programs', data),
    update: (id: number, data: { name: string; isActive: boolean }) =>
      put<ProgramListItem>(`/programs/${id}`, data),
  },

  procedureTypes: {
    list: (onlyActive = false) => get<ProcedureTypeListItem[]>(`/procedure-types${qs({ onlyActive })}`),
    create: (data: { name: string; cost: number | null }) => post<ProcedureTypeListItem>('/procedure-types', data),
    update: (id: number, data: { name: string; cost: number | null; isActive: boolean }) =>
      put<ProcedureTypeListItem>(`/procedure-types/${id}`, data),
  },

  presentedDocumentTypes: {
    list: (onlyActive = false) =>
      get<PresentedDocumentTypeListItem[]>(`/presented-document-types${qs({ onlyActive })}`),
    create: (data: { code: string; name: string; numberMode: string; sortOrder: number }) =>
      post<PresentedDocumentTypeListItem>('/presented-document-types', data),
    update: (id: number, data: { name: string; numberMode: string; isActive: boolean; sortOrder: number }) =>
      put<PresentedDocumentTypeListItem>(`/presented-document-types/${id}`, data),
  },

  identityDocumentTypes: {
    list: (onlyActive = false) =>
      get<IdentityDocumentTypeListItem[]>(`/identity-document-types${qs({ onlyActive })}`),
    create: (data: { code: string; name: string; numberMode: string; sortOrder: number }) =>
      post<IdentityDocumentTypeListItem>('/identity-document-types', data),
    update: (id: number, data: { name: string; numberMode: string; isActive: boolean; sortOrder: number }) =>
      put<IdentityDocumentTypeListItem>(`/identity-document-types/${id}`, data),
  },

  students: {
    list: (search?: string, onlyActive = false) =>
      get<StudentListItem[]>(`/students${qs({ search, onlyActive })}`),
    lookup: (dni: string) => get<StudentListItem | null>(`/students/lookup${qs({ dni })}`),
    create: (data: { idDocumentType: string; dni: string; name: string; programId: number; shift: Shift }) =>
      post<StudentListItem>('/students', data),
    update: (id: number, data: { idDocumentType: string; dni: string; name: string; programId: number; shift: Shift; isActive: boolean }) =>
      put<StudentListItem>(`/students/${id}`, data),
  },

  procedures: {
    list: (filters: { status?: ProcedureStatus; search?: string; year?: number; date?: string }) =>
      get<ProcedureListItem[]>(`/procedures${qs(filters)}`),
    get: (id: number) => get<ProcedureDetail>(`/procedures/${id}`),
    create: (data: Record<string, unknown>) => post<CreateProcedureResponse>('/procedures', data),
    update: (id: number, data: Record<string, unknown>) => put<ProcedureDetail>(`/procedures/${id}`, data),
    changeStatus: (id: number, status: ProcedureStatus, comment?: string) =>
      patch<ProcedureDetail>(`/procedures/${id}/status`, { status, comment }),
    remove: (id: number) => del<void>(`/procedures/${id}`),
  },

  correlatives: {
    list: () => get<CorrelativeYearItem[]>('/correlatives'),
    getYear: (year: number) => get<CorrelativeYearItem>(`/correlatives/${year}`),
    setNext: (year: number, nextNumber: number) =>
      put<CorrelativeYearItem>(`/correlatives/${year}/next`, { nextNumber }),
  },

  public: {
    lookup: (fileNumber: string, accessCode: string) =>
      post<PublicProcedureResult>('/public/lookup', { fileNumber, accessCode }),
  },
};
