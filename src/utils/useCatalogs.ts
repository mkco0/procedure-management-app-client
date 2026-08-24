import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  IdentityDocumentTypeListItem,
  OrgUnitOption,
  PresentedDocumentTypeListItem,
  ProcedureTypeListItem,
  ProgramListItem,
  UserOption,
} from '../types/domain';

export interface Catalogs {
  programs: ProgramListItem[];
  procedureTypes: ProcedureTypeListItem[];
  presentedDocumentTypes: PresentedDocumentTypeListItem[];
  identityDocumentTypes: IdentityDocumentTypeListItem[];
  staff: UserOption[];
  orgUnits: OrgUnitOption[];
  loading: boolean;
}

/** Loads the catalogs a trámite form needs, once. */
export function useCatalogs(): Catalogs {
  const [state, setState] = useState<Catalogs>({
    programs: [],
    procedureTypes: [],
    presentedDocumentTypes: [],
    identityDocumentTypes: [],
    staff: [],
    orgUnits: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.programs.list(true),
      api.procedureTypes.list(true),
      api.presentedDocumentTypes.list(true),
      api.identityDocumentTypes.list(true),
      api.users.options(),
      api.orgUnits.list(),
    ]).then(([programs, procedureTypes, presentedDocumentTypes, identityDocumentTypes, staff, orgUnits]) => {
      if (cancelled) return;
      setState({
        programs,
        procedureTypes,
        presentedDocumentTypes,
        identityDocumentTypes,
        staff,
        orgUnits,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
