import { api } from '../../../api/client';
import { DocumentTypeAdminPage } from './DocumentTypeAdminPage';

export function PresentedDocumentTypesAdminPage() {
  return (
    <DocumentTypeAdminPage
      eyebrow="Administración"
      title="Tipos de documento presentado"
      numberModeOptions={[
        { value: 'None', label: 'Sin número' },
        { value: 'Identifier', label: 'Identificador' },
        { value: 'Description', label: 'Descripción' },
      ]}
      list={() => api.presentedDocumentTypes.list()}
      create={(data) => api.presentedDocumentTypes.create(data)}
      update={(id, data) => api.presentedDocumentTypes.update(id, data)}
    />
  );
}
