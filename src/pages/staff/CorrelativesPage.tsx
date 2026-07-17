import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { Button, Card, ErrorNotice, Input, PageHeader } from '../../components/ui';
import type { CorrelativeYearItem } from '../../types/domain';

export function CorrelativesPage() {
  const [items, setItems] = useState<CorrelativeYearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [nextNumber, setNextNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.correlatives.list().then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(item: CorrelativeYearItem) {
    setEditingYear(item.year);
    setNextNumber(String(item.nextNumber));
    setError(null);
  }

  async function save(year: number) {
    setError(null);
    try {
      await api.correlatives.setNext(year, Number(nextNumber));
      setEditingYear(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el correlativo.');
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Operación" title="Correlativos" />

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-ink-soft">Cargando…</p>
        ) : (
          <table className="sheet-table w-full text-left text-sm">
            <thead>
              <tr className="bg-navy-100 text-xs uppercase tracking-wide text-navy-900">
                <th className="px-3 py-2 font-medium">Año</th>
                <th className="px-3 py-2 font-medium">Siguiente número</th>
                <th className="px-3 py-2 font-medium">Máximo usado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.year} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2 font-mono">{item.year}</td>
                  <td className="px-3 py-2 font-mono">
                    {editingYear === item.year ? (
                      <Input
                        value={nextNumber}
                        onChange={(e) => setNextNumber(e.target.value)}
                        className="max-w-28"
                        inputMode="numeric"
                      />
                    ) : (
                      item.nextNumber
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono">{item.maxUsed}</td>
                  <td className="px-3 py-2 text-right">
                    {editingYear === item.year ? (
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => save(item.year)}>Guardar</Button>
                        <Button variant="secondary" onClick={() => setEditingYear(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item)} className="text-md font-medium text-navy-700 hover:underline">
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {error && (
        <div className="mt-4 max-w-md">
          <ErrorNotice message={error} />
        </div>
      )}

      {items.length === 0 && !loading && (
        <p className="mt-4 text-sm text-ink-soft">
          Los correlativos se crean automáticamente al registrar el primer trámite de cada año.
        </p>
      )}
    </div>
  );
}
