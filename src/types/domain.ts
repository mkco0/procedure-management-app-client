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
  | 'AreaAdministracion'
  | 'UnidadAcademica'
  | 'AreaPrograma'
  | 'EntregaSecretaria'
  | 'EntregaMesaDePartes'
  | 'EntregaDireccionGeneral'
  | 'EntregaAreaAdministracion'
  | 'EntregaUnidadAcademica'
  | 'EntregaAreaPrograma'
  | 'Completado'
  | 'Observado'
  | 'Rechazado';

export const STATUS_LABELS: Record<ProcedureStatus, string> = {
  MesaDePartes: 'Mesa de partes',
  SecretariaAcademica: 'Secretaría Académica',
  DireccionGeneral: 'Dirección General',
  AreaAdministracion: 'Área de Administración',
  UnidadAcademica: 'Unidad Académica',
  AreaPrograma: 'Área del programa',
  EntregaSecretaria: 'Entrega - Secretaría Académica',
  EntregaMesaDePartes: 'Entrega - Mesa de Partes',
  EntregaDireccionGeneral: 'Entrega - Dirección General',
  EntregaAreaAdministracion: 'Entrega - Área de Administración',
  EntregaUnidadAcademica: 'Entrega - Unidad Académica',
  EntregaAreaPrograma: 'Entrega - Área del programa',
  Completado: 'Completado',
  Observado: 'Observado',
  Rechazado: 'Rechazado',
};

/** The parallel hand-over stages — one per área — that all converge on Completado. */
export const DELIVERY_STATUSES: ProcedureStatus[] = [
  'EntregaSecretaria',
  'EntregaMesaDePartes',
  'EntregaDireccionGeneral',
  'EntregaAreaAdministracion',
  'EntregaUnidadAcademica',
  'EntregaAreaPrograma',
];

/** Every status on the regular circuit, in canonical order (used for filters). */
export const STATUS_ORDER: ProcedureStatus[] = [
  'MesaDePartes',
  'SecretariaAcademica',
  'DireccionGeneral',
  ...DELIVERY_STATUSES,
  'Completado',
];

// ---------------- Área / Estado taxonomy ----------------
//
// A ProcedureStatus conflates two axes: which office physically holds the
// expediente (área) and what state it's in (estado). This section resolves
// any status onto that pair — the single source of truth the UI reads from
// instead of re-deriving it status-by-status in each component.

/**
 * Every área a trámite can physically be at: the three offices on the
 * regular circuit, plus three occasional derivation áreas reachable from
 * Secretaría Académica when needed.
 */
export type Area =
  | 'MesaDePartes'
  | 'SecretariaAcademica'
  | 'DireccionGeneral'
  | 'AreaAdministracion'
  | 'UnidadAcademica'
  | 'AreaPrograma';

export const AREA_LABELS: Record<Area, string> = {
  MesaDePartes: 'Mesa de Partes',
  SecretariaAcademica: 'Secretaría Académica',
  DireccionGeneral: 'Dirección General',
  AreaAdministracion: 'Área de Administración',
  UnidadAcademica: 'Unidad Académica',
  AreaPrograma: 'Área del programa',
};

/**
 * Labels an área, resolving `AreaPrograma` to the trámite's own program name
 * when one is given. Every área label in the UI should go through this
 * rather than reading AREA_LABELS directly, so AreaPrograma never renders
 * as the generic fallback when a program name is available.
 */
export function areaLabel(area: Area, programName?: string | null): string {
  if (area === 'AreaPrograma' && programName) return `Área de ${programName}`;
  return AREA_LABELS[area];
}

/** The state a trámite is in, independent of which área holds it. */
export type Estado = 'EnTramite' | 'EnEntrega' | 'Observado' | 'Completado' | 'Rechazado';

export const ESTADO_LABELS: Record<Estado, string> = {
  EnTramite: 'En trámite',
  EnEntrega: 'En entrega',
  Observado: 'Observado',
  Completado: 'Completado',
  Rechazado: 'Rechazado',
};

/**
 * Every área's pair of statuses — while work is in progress there, and once
 * it's ready for hand-over there. Includes the three regular-circuit offices
 * and the three occasional derivation áreas alike; every área hands over its
 * own way, so there's no functional difference between them here.
 */
export const AREA_STATUSES: { area: Area; enTramite: ProcedureStatus; enEntrega: ProcedureStatus }[] = [
  { area: 'MesaDePartes', enTramite: 'MesaDePartes', enEntrega: 'EntregaMesaDePartes' },
  { area: 'SecretariaAcademica', enTramite: 'SecretariaAcademica', enEntrega: 'EntregaSecretaria' },
  { area: 'DireccionGeneral', enTramite: 'DireccionGeneral', enEntrega: 'EntregaDireccionGeneral' },
  { area: 'AreaAdministracion', enTramite: 'AreaAdministracion', enEntrega: 'EntregaAreaAdministracion' },
  { area: 'UnidadAcademica', enTramite: 'UnidadAcademica', enEntrega: 'EntregaUnidadAcademica' },
  { area: 'AreaPrograma', enTramite: 'AreaPrograma', enEntrega: 'EntregaAreaPrograma' },
];

const AREA_BY_STATUS: Partial<Record<ProcedureStatus, Area>> = {};
const ESTADO_BY_STATUS = {} as Record<ProcedureStatus, Estado>;
for (const { area, enTramite, enEntrega } of AREA_STATUSES) {
  AREA_BY_STATUS[enTramite] = area;
  AREA_BY_STATUS[enEntrega] = area;
  ESTADO_BY_STATUS[enTramite] = 'EnTramite';
  ESTADO_BY_STATUS[enEntrega] = 'EnEntrega';
}
ESTADO_BY_STATUS.Completado = 'Completado';
ESTADO_BY_STATUS.Observado = 'Observado';
ESTADO_BY_STATUS.Rechazado = 'Rechazado';

/**
 * True only for the six statuses where a trámite is actively being worked on
 * at an office — moving to one of these is a genuine área change. The three
 * delivery statuses (Entrega*) also name an office, but reaching one doesn't
 * move the trámite anywhere: it's the same office switching to "ready for
 * hand-over", i.e. an estado change, not an área move.
 */
export function isInProgressStatus(status: ProcedureStatus): boolean {
  return ESTADO_BY_STATUS[status] === 'EnTramite';
}

/**
 * Resolves a stored status into the (área, estado) pair the UI shows.
 * `resumeStage` — required to know where an Observado trámite is held —
 * comes from ProcedureDetail/ProcedureListItem/PublicProcedureResult.
 */
export function describeStatus(
  status: ProcedureStatus,
  resumeStage?: ProcedureStatus | null,
): { area: Area | null; estado: Estado } {
  const area = AREA_BY_STATUS[status] ?? (resumeStage ? (AREA_BY_STATUS[resumeStage] ?? null) : null);
  return { area, estado: ESTADO_BY_STATUS[status] };
}

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

/** Minimal active-staff entry for pickers (e.g. the "responsable" dropdown). */
export interface UserOption {
  id: number;
  name: string;
}

// ---------------- Programs ----------------

export interface ProgramListItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  oldNames: string[];
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
  // Null only for historical students bulk-imported without a recorded
  // turno; any new trámite registered for them fills it in.
  shift: Shift | null;
  isActive: boolean;
}

/** One page of /students. `total` is the full match count, ignoring paging. */
export interface StudentListPage {
  items: StudentListItem[];
  total: number;
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
  programName: string;
  shift: Shift;
  registeredByName: string;
  personInChargeName: string | null;
  status: ProcedureStatus;
  resumeStage: ProcedureStatus | null;
}

/** One page of /procedures. `total` is the full match count, ignoring paging. */
export interface ProcedureListPage {
  items: ProcedureListItem[];
  total: number;
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
  studentDni: string;
  programId: number;
  programCode: string;
  programName: string;
  shift: Shift;
  personInChargeId: number | null;
  personInChargeName: string | null;
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
  programName: string;
  status: ProcedureStatus;
  resumeStage: ProcedureStatus | null;
  registeredAt: string;
  history: PublicHistoryItem[];
}
