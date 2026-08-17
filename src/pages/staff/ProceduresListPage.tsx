import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye, Filter, PenLine, Search, Trash2, X } from 'lucide-react';
import { api } from '../../api/client';
import { AreaBadge, Button, Card, DateInput, EmptyState, EstadoBadge, Field, Input, Select } from '../../components/ui';
import { DeleteProcedureDialog } from './procedures/DeleteProcedureDialog';
import { EditProcedureModal } from './procedures/EditProcedureModal';
import { NewProcedureModal } from './procedures/NewProcedureModal';
import { ProcedureDetailModal } from './procedures/ProcedureDetailModal';
import { useCatalogs } from '../../utils/useCatalogs';
import {
  APPLICANT_TYPE_LABELS,
  AREA_LABELS,
  AREA_STATUSES,
  SHIFT_LABELS,
  describeStatus,
  type Estado,
  type ProcedureListItem,
  type ProcedureStatus,
} from '../../types/domain';
import { formatDate, todayLimaISODate, toTitleCase } from '../../utils/format';

const PAGE_SIZE = 50;

export function ProceduresListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<ProcedureListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState<ProcedureStatus | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<Estado | ''>('');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number | ''>('');
  // Defaults to "today" (Lima) per operator request — Mesa de Partes mostly
  // cares about today's queue, not the full historical planilla.
  const [date, setDate] = useState<string>(todayLimaISODate());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProcedureListItem | null>(null);

  // Fetched once here rather than inside each form, which would otherwise
  // duplicate all five catalog requests on every visit to this page.
  const catalogs = useCatalogs();

  // Three focused, always-visible row actions instead of a hidden menu —
  // Ver más and Actualizar are URL-addressable off this same page (/nuevo for
  // create, /:id for view, /:id?edit=1 for edit); Eliminar is local state
  // since it's a quick, non-shareable confirmation rather than a real screen.
  const isNewRoute = location.pathname.endsWith('/nuevo');
  const detailId = !isNewRoute && id ? Number(id) : null;
  const isEditRoute = searchParams.get('edit') === '1';

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!filtersRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [filtersOpen]);

  function fetchItems() {
    setLoading(true);
    return api.procedures
      .list({
        status: areaFilter || undefined,
        estado: estadoFilter || undefined,
        search: search || undefined,
        year: year || undefined,
        date: date || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  // A filter/search change starts over at the first page.
  useEffect(() => setPage(0), [areaFilter, estadoFilter, search, year, date]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter, estadoFilter, search, year, date, page]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - i);
  }, []);

  const activeFilterCount = [date, areaFilter, estadoFilter, search, year].filter(Boolean).length;

  function closeModal() {
    navigate('/app/tramites');
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy-900">Trámites</h1>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="primary" onClick={() => navigate('/app/tramites/nuevo')}>
            Nuevo trámite
          </Button>
        </div>
      </div>

      <Card>
        {/* Filters live inside the table card as a toolbar, so the controls read
            as belonging to the list they filter rather than floating above it. */}
        <div className="no-print flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative w-full max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <Input
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {activeFilterCount > 0 && (
            <span className="text-sm text-ink-soft">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro aplicado' : 'filtros aplicados'}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Labelled via title/aria rather than a stacked <label>, so it sits
                on the same baseline as the search field and filter button. */}
            <DateInput title="Fecha" aria-label="Fecha" value={date} onChange={setDate} className="w-40" />

            {/* Área/estado and año are secondary filter dimensions — tucked
                behind one button+popover so the toolbar stays a single row,
                instead of every dimension getting its own always-visible <select>. */}
            <div ref={filtersRef} className="relative">
              <Button
                variant="secondary"
                onClick={() => setFiltersOpen((o) => !o)}
                className="relative"
              >
                <Filter size={15} />
                Filtrar
                {(areaFilter || estadoFilter || year) && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold-600" />
                )}
              </Button>

              {filtersOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-sm border border-line bg-surface p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <Field label="Área">
                      <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value as ProcedureStatus | '')}>
                        <option value="">Todas</option>
                        {AREA_STATUSES.map(({ area, enTramite }) => (
                          <option key={area} value={enTramite}>
                            {AREA_LABELS[area]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Estado">
                      <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value as Estado | '')}>
                        <option value="">Todos</option>
                        <option value="EnTramite">En trámite</option>
                        <option value="EnEntrega">En entrega</option>
                        <option value="Completado">Completado</option>
                        <option value="Observado">Observado</option>
                        <option value="Rechazado">Rechazado</option>
                      </Select>
                    </Field>
                    <Field label="Año">
                      <Select value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">Todos los años</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {(date || areaFilter || estadoFilter || search || year) && (
              <button
                type="button"
                onClick={() => {
                  setDate('');
                  setAreaFilter('');
                  setEstadoFilter('');
                  setSearch('');
                  setYear('');
                }}
                aria-label="Ver todos"
                title="Ver todos"
                className="rounded-sm p-1.5 text-ink-soft hover:bg-canvas hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-6 text-sm text-ink-soft">Cargando…</p>
          ) : items.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No hay trámites" description="Registre un nuevo trámite." />
            </div>
          ) : (
            <table className="sheet-table w-full text-center text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-medium">Correlativo</th>
                  <th className="hidden px-4 py-3 font-medium print:table-cell">Doc. presentado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Expediente</th>
                  <th className="px-4 py-3 font-medium">Nombre completo</th>
                  <th className="px-4 py-3 font-medium">Tipo de trámite</th>
                  <th className="hidden px-4 py-3 font-medium print:table-cell">Programa/Turno</th>
                  <th className="hidden px-4 py-3 font-medium print:table-cell">Registrado por</th>
                  <th className="hidden px-4 py-3 font-medium print:table-cell">Responsable</th>
                  <th className="hidden px-4 py-3 font-medium print:table-cell">Área</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="no-print px-2 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const { area, estado } = describeStatus(p.status, p.resumeStage);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/app/tramites/${p.id}`)}
                      className="cursor-pointer transition-colors hover:bg-canvas/60"
                    >
                      <td className="px-4 py-3.5">{p.correlativeNumber}</td>
                      <td className="hidden px-4 py-3.5 print:table-cell">
                        {p.documentType}
                        {p.documentNumber ? ` (${p.documentNumber})` : ''}
                      </td>
                      <td className="px-4 py-3.5">{formatDate(p.registeredAt)}</td>
                      <td className="px-4 py-3.5 text-navy-800">{p.fileNumber}</td>
                      <td className="px-4 py-3.5">{toTitleCase(p.applicantName)}</td>
                      <td className="px-4 py-3.5">{toTitleCase(p.procedureTypeName)}</td>
                      <td className="hidden px-4 py-3.5 print:table-cell">
                        {p.programName ? `${p.programName} / ${SHIFT_LABELS[p.shift!]}` : APPLICANT_TYPE_LABELS[p.applicantType]}
                      </td>
                      <td className="hidden px-4 py-3.5 print:table-cell">{p.registeredByName}</td>
                      <td className="hidden px-4 py-3.5 print:table-cell">
                        {p.personInChargeName ?? <span className="text-ink-soft">—</span>}
                      </td>
                      <td className="hidden px-4 py-3.5 print:table-cell">
                        <AreaBadge area={area} programName={p.programName} />
                      </td>
                      <td className="px-4 py-3.5">
                        <EstadoBadge estado={estado} />
                      </td>
                      <td className="no-print px-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/app/tramites/${p.id}`)}
                            className="rounded-sm p-1.5 text-navy-600 hover:bg-navy-100 hover:text-navy-800"
                            aria-label={`Ver más del trámite ${p.fileNumber}`}
                            title="Ver más"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/app/tramites/${p.id}?edit=1`)}
                            className="rounded-sm p-1.5 text-gold-600 hover:bg-gold-100 hover:text-gold-700"
                            aria-label={`Actualizar el trámite ${p.fileNumber}`}
                            title="Actualizar"
                          >
                            <PenLine size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="rounded-sm p-1.5 text-[color:var(--color-status-rechazado)] hover:bg-red-50"
                            aria-label={`Eliminar el trámite ${p.fileNumber}`}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </Card>

      {!loading && total > 0 && (
        <div className="no-print mt-4 flex items-center justify-between text-sm">
          <p className="text-ink-soft">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          {total > PAGE_SIZE && (
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      <NewProcedureModal open={isNewRoute} catalogs={catalogs} onClose={closeModal} onCreated={fetchItems} />

      <ProcedureDetailModal
        procedureId={detailId}
        open={detailId !== null && !isEditRoute}
        onClose={closeModal}
        onChanged={fetchItems}
      />

      <EditProcedureModal
        procedureId={detailId}
        open={detailId !== null && isEditRoute}
        catalogs={catalogs}
        onClose={closeModal}
        onSaved={fetchItems}
      />

      <DeleteProcedureDialog item={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={fetchItems} />
    </div>
  );
}
