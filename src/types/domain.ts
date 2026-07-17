// Single source of truth on the frontend for domain enums and field limits,
// mirroring TramitesApi/Common/Enums.cs and FieldLimits.cs on the backend.

export type UserRole = 'Admin' | 'Secretary';

export type Shift = 'Day' | 'Night';

export type PresentedNumberMode = 'None' | 'Identifier' | 'Description';

export type IdentityNumberMode = 'DniDigits' | 'Alphanumeric';

export type ProcedureStatus =
  | 'MesaDePartes'
  | 'SecretariaAcademica'
  | 'DireccionGeneral'
  | 'SecretariaEntrega'
  | 'Completado'
  | 'Observado'
  | 'Rechazado';

export const STATUS_LABELS: Record<ProcedureStatus, string> = {
  MesaDePartes: 'Mesa de partes',
  SecretariaAcademica: 'Secretaría Académica',
  DireccionGeneral: 'Dirección General',
  SecretariaEntrega: 'Entrega en Secretaría Académica',
  Completado: 'Completado',
  Observado: 'Observado',
  Rechazado: 'Rechazado',
};

export const STATUS_ORDER: ProcedureStatus[] = [
  'MesaDePartes',
  'SecretariaAcademica',
  'DireccionGeneral',
  'SecretariaEntrega',
  'Completado',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Administrador',
  Secretary: 'Secretaría',
};

export const SHIFT_LABELS: Record<Shift, string> = {
  Day: 'Día',
  Night: 'Noche',
};

export const SHIFT_SHORT: Record<Shift, string> = {
  Day: 'D',
  Night: 'N',
};

export const FIELD_LIMITS = {
  staffDniLength: 8,
  studentDocNumberMax: 20,
  documentTypeCodeMax: 10,
  documentTypeNameMax: 100,
  presentedIdentifierMax: 20,
  presentedDescriptionMax: 100,
  commentMax: 500,
  fileNumberMax: 20,
  passwordMin: 6,
  procedureTypeOtherMax: 200,
};

export const PROCEDURE_TYPE_OTHER_NAME = 'Otro';

// ---------------- Auth ----------------

export interface UserProfile {
  id: number;
  name: string;
  dni: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

// ---------------- Users ----------------

export interface UserListItem {
  id: number;
  name: string;
  dni: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// ---------------- Programs ----------------

export interface ProgramListItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

// ---------------- Procedure types ----------------

export interface ProcedureTypeListItem {
  id: number;
  name: string;
  cost: number | null;
  isActive: boolean;
}

// ---------------- Document type catalogs ----------------

export interface PresentedDocumentTypeListItem {
  id: number;
  code: string;
  name: string;
  numberMode: PresentedNumberMode;
  isActive: boolean;
  sortOrder: number;
}

export interface IdentityDocumentTypeListItem {
  id: number;
  code: string;
  name: string;
  numberMode: IdentityNumberMode;
  isActive: boolean;
  sortOrder: number;
}

// ---------------- Students ----------------

export interface StudentListItem {
  id: number;
  idDocumentType: string;
  dni: string;
  name: string;
  programId: number;
  programCode: string;
  shift: Shift;
  isActive: boolean;
}

// ---------------- Procedures ----------------

export interface ProcedureListItem {
  id: number;
  correlativeNumber: number;
  correlativeYear: number;
  fileNumber: string;
  documentType: string;
  documentNumber: string | null;
  registeredAt: string;
  applicantName: string;
  procedureTypeName: string;
  programCode: string;
  shift: Shift;
  registeredByName: string;
  status: ProcedureStatus;
}

export interface ProcedureHistoryItem {
  status: ProcedureStatus;
  changedByName: string;
  comment: string | null;
  changedAt: string;
}

export interface ProcedureDetail {
  id: number;
  correlativeNumber: number;
  correlativeYear: number;
  fileNumber: string;
  documentType: string;
  documentNumber: string | null;
  procedureTypeId: number;
  procedureTypeName: string;
  procedureTypeOther: string | null;
  applicantName: string;
  programId: number;
  programCode: string;
  shift: Shift;
  status: ProcedureStatus;
  resumeStage: ProcedureStatus | null;
  comment: string | null;
  registeredAt: string;
  allowedNextStatuses: ProcedureStatus[];
  history: ProcedureHistoryItem[];
}

export interface CreateProcedureResponse {
  procedure: ProcedureDetail;
  accessCode: string;
}

// ---------------- Correlatives ----------------

export interface CorrelativeYearItem {
  year: number;
  nextNumber: number;
  maxUsed: number;
}

// ---------------- Public lookup ----------------

export interface PublicHistoryItem {
  status: ProcedureStatus;
  comment: string | null;
  changedAt: string;
}

export interface PublicProcedureResult {
  fileNumber: string;
  applicantName: string;
  procedureTypeName: string;
  programCode: string;
  status: ProcedureStatus;
  registeredAt: string;
  history: PublicHistoryItem[];
}
