import type {
  ApplicantListItem,
  ApplicantListPage,
  ApplicantType,
  CorrelativeYearItem,
  CreateProcedureResponse,
  Estado,
  IdentityDocumentTypeListItem,
  LoginResponse,
  OrgUnitOption,
  PresentedDocumentTypeListItem,
  ProcedureDetail,
  ProcedureListPage,
  ProcedureStatus,
  ProcedureTypeListItem,
  ProgramListItem,
  PublicProcedureResult,
  Shift,
  UserListItem,
  UserOption,
  UserProfile,
} from '../types/domain';

interface CreateProcedurePayload {
  fileNumber: string;
  registeredAt: string | null;
  documentType: string;
  documentNumber: string | null;
  procedureTypeId: number;
  procedureTypeOther: string | null;
  applicantType: ApplicantType;
  applicantName: string;
  programId: number | null;
  shift: Shift | null;
  personInChargeId: number | null;
  idDocumentType: string;
  idDocumentNumber: string;
  comment: string | null;
}

interface UpdateProcedurePayload {
  documentType: string;
  documentNumber: string | null;
  procedureTypeId: number;
  procedureTypeOther: string | null;
  applicantName: string;
  programId: number | null;
  shift: Shift | null;
  personInChargeId: number | null;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  comment: string | null;
}

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
    changePassword: (currentPassword: string, newPassword: string) =>
      post<void>('/auth/change-password', { currentPassword, newPassword }),
  },

  users: {
    list: () => get<UserListItem[]>('/users'),
    // Active staff only, readable by any signed-in user — /users itself is
    // Admin-only, but Secretaría needs this to pick a responsable.
    options: () => get<UserOption[]>('/users/options'),
    create: (data: { name: string; dni: string; password: string; role: string; orgUnitId: number | null }) =>
      post<UserListItem>('/users', data),
    update: (
      id: number,
      data: {
        name: string;
        dni: string;
        role: string;
        isActive: boolean;
        password?: string | null;
        orgUnitId: number | null;
      },
    ) => put<UserListItem>(`/users/${id}`, data),
  },

  // The institution's organigrama, flat (each node carries its parentId).
  // Readable by any signed-in user — it's what the responsable picker
  // cascades through.
  orgUnits: {
    list: () => get<OrgUnitOption[]>('/org-units'),
  },

  programs: {
    list: (onlyActive = false) => get<ProgramListItem[]>(`/programs${qs({ onlyActive })}`),
    create: (data: { code: string; name: string; oldNames?: string[] }) => post<ProgramListItem>('/programs', data),
    update: (id: number, data: { name: string; isActive: boolean; oldNames?: string[] }) =>
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

  applicants: {
    list: (type?: ApplicantType, search?: string, onlyActive = false, limit?: number, offset?: number) =>
      get<ApplicantListPage>(`/applicants${qs({ type, search, onlyActive, limit, offset })}`),
    lookup: (type: ApplicantType, dni: string) =>
      get<ApplicantListItem | null>(`/applicants/lookup${qs({ type, dni })}`),
    create: (data: { type: ApplicantType; idDocumentType: string; dni: string; name: string; programId: number | null; shift: Shift | null }) =>
      post<ApplicantListItem>('/applicants', data),
    update: (id: number, data: { idDocumentType: string; dni: string; name: string; programId: number | null; shift: Shift | null; isActive: boolean }) =>
      put<ApplicantListItem>(`/applicants/${id}`, data),
  },

  procedures: {
    list: (
      filters: {
        status?: ProcedureStatus;
        estado?: Estado;
        search?: string;
        year?: number;
        date?: string;
        limit?: number;
        offset?: number;
      },
    ) => get<ProcedureListPage>(`/procedures${qs(filters)}`),
    get: (id: number) => get<ProcedureDetail>(`/procedures/${id}`),
    create: (data: CreateProcedurePayload) => post<CreateProcedureResponse>('/procedures', data),
    update: (id: number, data: UpdateProcedurePayload) => put<ProcedureDetail>(`/procedures/${id}`, data),
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
