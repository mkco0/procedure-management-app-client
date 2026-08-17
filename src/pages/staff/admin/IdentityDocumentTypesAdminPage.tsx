import { api } from '../../../api/client';
import { DocumentTypeAdminPage } from './DocumentTypeAdminPage';

export function IdentityDocumentTypesAdminPage() {
  return (
    <DocumentTypeAdminPage
      title="Tipos de documento de identidad"
      numberModeOptions={[
        { value: 'DniDigits', label: '8 dígitos (DNI)' },
        { value: 'Alphanumeric', label: 'Alfanumérico' },
        { value: 'RucDigits', label: '11 dígitos (RUC)' },
      ]}
      list={() => api.identityDocumentTypes.list()}
      create={(data) => api.identityDocumentTypes.create(data)}
      update={(id, data) => api.identityDocumentTypes.update(id, data)}
    />
  );
}
