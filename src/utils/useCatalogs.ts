import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  IdentityDocumentTypeListItem,
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
    ]).then(([programs, procedureTypes, presentedDocumentTypes, identityDocumentTypes, staff]) => {
      if (cancelled) return;
      setState({
        programs,
        procedureTypes,
        presentedDocumentTypes,
        identityDocumentTypes,
        staff,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
