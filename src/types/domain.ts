// Single source of truth on the frontend for domain enums and field limits,
// mirroring ProceduresAPI/Common/Enums.cs and FieldLimits.cs on the backend.

export type UserRole = 'Admin' | 'Secretary';

export type Shift = 'Day' | 'Night';

export type PresentedNumberMode = 'None' | 'Identifier' | 'Description';

export type IdentityNumberMode = 'DniDigits' | 'Alphanumeric';

// ---------------- Área / Estado taxonomy ----------------
//
// A trámite is described by two independent axes, stored as separate columns
// on the backend: which office physically holds the expediente (área) and
// what state it's in (estado). Every DTO carries both directly, so the UI
// reads them straight off the server rather than deriving them.

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

/** The three offices on the regular circuit, in order (used for filters). */
export const CIRCUIT_AREAS: Area[] = ['MesaDePartes', 'SecretariaAcademica', 'DireccionGeneral'];

/** Occasional derivation áreas — off the regular circuit. */
export const DERIVATION_AREAS: Area[] = ['AreaAdministracion', 'UnidadAcademica', 'AreaPrograma'];

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
export type Estado = 'EnTramite' | 'ParaEntrega' | 'Observado' | 'Completado' | 'Rechazado';

export const ESTADO_LABELS: Record<Estado, string> = {
  EnTramite: 'En trámite',
  // "Para entrega", not "En entrega": the document is finished and waiting
  // at its área to be collected, not in transit between offices.
  ParaEntrega: 'Para entrega',
  Observado: 'Observado',
  Completado: 'Completado',
  Rechazado: 'Rechazado',
};

/** Estados that sit off the regular circuit — the stepper calls these out separately. */
export function isDetoured(estado: Estado): boolean {
  return estado === 'Observado' || estado === 'Rechazado';
}

// ---------------- Circuit stepper ----------------
//
// The circuit as five sequential steps. The first three are keyed by área;
// "Entrega" and "Completado" are reached by estado (ParaEntrega / Completado)
// regardless of which office holds the expediente. The Secretaría Académica
// step also stands in for the three occasional derivation áreas, since
// they're all reached from there and aren't a separate circuit stage.

export interface WorkflowStep {
  label: string;
  /** Áreas whose in-progress state sits at this step (empty for estado-driven steps). */
  areas: Area[];
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { label: 'Mesa de partes', areas: ['MesaDePartes'] },
  {
    label: 'Secretaría Académica',
    areas: ['SecretariaAcademica', 'AreaAdministracion', 'UnidadAcademica', 'AreaPrograma'],
  },
  { label: 'Dirección General', areas: ['DireccionGeneral'] },
  { label: 'Entrega', areas: [] },
  { label: 'Completado', areas: [] },
];

export const ENTREGA_STEP_INDEX = 3;
export const COMPLETADO_STEP_INDEX = 4;

/**
 * Which circuit step an (área, estado) pair sits at. Completado and
 * ParaEntrega are positioned by estado; every other estado is positioned by
 * área. A detoured estado (Observado/Rechazado) still resolves to its área's
 * step so the stepper can show how far the trámite had progressed.
 */
export function stepIndex(area: Area, estado: Estado): number {
  if (estado === 'Completado') return COMPLETADO_STEP_INDEX;
  if (estado === 'ParaEntrega') return ENTREGA_STEP_INDEX;
  return WORKFLOW_STEPS.findIndex((s) => s.areas.includes(area));
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
  nameMax: 200,
  codeMax: 20,
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
  area: Area;
  estado: Estado;
}

export interface ProcedureHistoryItem {
  area: Area;
  estado: Estado;
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
  area: Area;
  estado: Estado;
  comment: string | null;
  registeredAt: string;
  // The conventional next step, for the UI to pre-select. Null on a terminal
  // trámite. Every other (área, estado) pair stays selectable — this is a
  // default, not a whitelist.
  suggestedArea: Area | null;
  suggestedEstado: Estado | null;
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
  area: Area;
  estado: Estado;
  comment: string | null;
  changedAt: string;
}

export interface PublicProcedureResult {
  fileNumber: string;
  applicantName: string;
  procedureTypeName: string;
  programCode: string;
  programName: string;
  area: Area;
  estado: Estado;
  registeredAt: string;
  history: PublicHistoryItem[];
}
