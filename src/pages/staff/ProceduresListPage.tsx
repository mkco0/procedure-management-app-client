import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Button, Card, EmptyState, Input, Select, StatusBadge } from '../../components/ui';
import { SHIFT_SHORT, STATUS_LABELS, STATUS_ORDER, type ProcedureListItem, type ProcedureStatus } from '../../types/domain';
import { formatDate, todayLimaISODate } from '../../utils/format';

const ALL_STATUSES: ProcedureStatus[] = [...STATUS_ORDER, 'Observado', 'Rechazado'];

function planillaRows(items: ProcedureListItem[]) {
  return items.map((p) => ({
    Correlativo: `${p.correlativeNumber}-${p.correlativeYear}`,
    'Doc. presentado': p.documentType + (p.documentNumber ? ` (${p.documentNumber})` : ''),
    Fecha: formatDate(p.registeredAt),
    Expediente: p.fileNumber,
    Nombres: p.applicantName,
    'Tipo trámite': p.procedureTypeName,
    'Programa/Turno': `${p.programCode}/${SHIFT_SHORT[p.shift]}`,
    'Registrado por': p.registeredByName,
    Estado: STATUS_LABELS[p.status],
  }));
}

export function ProceduresListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProcedureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ProcedureStatus | ''>('');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number | ''>('');
  // Defaults to "today" (Lima) per operator request — Mesa de Partes mostly
  // cares about today's queue, not the full historical planilla.
  const [date, setDate] = useState<string>(todayLimaISODate());

  useEffect(() => {
    setLoading(true);
    api.procedures
      .list({ status: status || undefined, search: search || undefined, year: year || undefined, date: date || undefined })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [status, search, year, date]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - i);
  }, []);

  const showingToday = date === todayLimaISODate() && !status && !search && !year;

  function exportXlsx() {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(planillaRows(items));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Planilla');
      XLSX.writeFile(wb, `planilla-tramites-${todayLimaISODate()}.xlsx`);
    });
  }

  function exportPdf() {
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([{ default: JsPDF }, autoTableModule]) => {
      const autoTable = autoTableModule.default;
      const doc = new JsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Planilla de trámites — IESTP Carlos Cueto Fernandini', 14, 14);
      doc.setFontSize(9);
      doc.text(`Generado: ${formatDate(new Date().toISOString())}`, 14, 20);

      const rows = planillaRows(items);
      autoTable(doc, {
        startY: 26,
        head: [Object.keys(rows[0] ?? {})],
        body: rows.map((r) => Object.values(r)),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [27, 59, 95] }, // navy-800
      });

      doc.save(`planilla-tramites-${todayLimaISODate()}.pdf`);
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold-700 mb-2 no-print">Operación</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-900">
            Trámites {showingToday && <span className="text-base font-normal text-ink-soft">- Hoy</span>}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="primary" onClick={exportXlsx}>
            Exportar Excel
          </Button>
          <Button variant="primary" onClick={exportPdf}>
            Exportar PDF
          </Button>
          <Link to="/app/tramites/nuevo">
            <Button variant="primary">Nuevo trámite</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 no-print">
        <Input
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as ProcedureStatus | '')} className="max-w-52">
          <option value="">TODOS LOS ESTADOS</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="max-w-32">
          <option value="">TODOS LOS AÑOS</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">Fecha</span>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-40" />
        </label>
        {(date || status || search || year) && (
          <Button
            variant="secondary"
            onClick={() => {
              setDate('');
              setStatus('');
              setSearch('');
              setYear('');
            }}
          >
            Ver todos
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-ink-soft">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No hay trámites" description="Registre un nuevo trámite." />
          </div>
        ) : (
          <table className="sheet-table w-full text-left text-sm">
            <thead>
              <tr className="bg-navy-100 text-xs uppercase tracking-wide text-navy-900">
                <th className="px-3 py-2 font-medium">Correlativo</th>
                <th className="px-3 py-2 font-medium">Doc. presentado</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Expediente</th>
                <th className="px-3 py-2 font-medium">Nombres</th>
                <th className="px-3 py-2 font-medium">Tipo de trámite</th>
                <th className="px-3 py-2 font-medium">Programa/Turno</th>
                <th className="px-3 py-2 font-medium">Registrado por</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/app/tramites/${p.id}`)}
                  className="cursor-pointer hover:bg-navy-100/40"
                >
                  <td className="px-3 py-2 font-mono">{`${p.correlativeNumber}-${p.correlativeYear}`}</td>
                  <td className="px-3 py-2">
                    {p.documentType}
                    {p.documentNumber ? ` (${p.documentNumber})` : ''}
                  </td>
                  <td className="px-3 py-2">{formatDate(p.registeredAt)}</td>
                  <td className="px-3 py-2 font-mono text-navy-800">{p.fileNumber}</td>
                  <td className="px-3 py-2">{p.applicantName}</td>
                  <td className="px-3 py-2">{p.procedureTypeName}</td>
                  <td className="px-3 py-2">{`${p.programCode}/${SHIFT_SHORT[p.shift]}`}</td>
                  <td className="px-3 py-2">{p.registeredByName}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
