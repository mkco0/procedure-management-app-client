import { useEffect, useMemo, useRef, useState } from 'react';
import { Field, Select } from './ui';
import { isTopLevelUnit, splitOrgUnit, type OrgUnitOption } from '../types/domain';

/**
 * Picks one box of the organigrama (área, or a subárea within it) — the
 * placement stored on a staff account. `value` is the chosen unit's id as a
 * string, or '' for no placement.
 *
 * Selecting only an área is a valid answer, not a half-finished one: staff
 * routinely belong to the área itself rather than to any of its subáreas.
 */
export function OrgUnitSelect({
  orgUnits,
  value,
  onChange,
}: {
  orgUnits: OrgUnitOption[];
  value: string;
  onChange: (orgUnitId: string) => void;
}) {
  const [areaId, setAreaId] = useState('');
  const syncedFor = useRef<string | null>(null);

  const areas = useMemo(() => orgUnits.filter(isTopLevelUnit), [orgUnits]);
  const subAreas = useMemo(
    () => (areaId ? orgUnits.filter((u) => u.parentId === Number(areaId)) : []),
    [orgUnits, areaId],
  );

  // The stored value is a single unit id; recover which área it hangs from so
  // the upper select shows the right branch when editing an existing user.
  useEffect(() => {
    if (orgUnits.length === 0 || syncedFor.current === value) return;
    syncedFor.current = value;
    setAreaId(value ? splitOrgUnit(Number(value), orgUnits).areaId : '');
  }, [value, orgUnits]);

  // Switching área commits the área itself as the placement — the subárea
  // select starts blank, and blank here means "the área", not "unset".
  function pickArea(next: string) {
    setAreaId(next);
    syncedFor.current = next;
    onChange(next);
  }

  return (
    <>
      <Field label="Área">
        <Select value={areaId} onChange={(e) => pickArea(e.target.value)}>
          <option value="">Sin asignar</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subárea" hint={subAreas.length > 0 ? 'Opcional.' : undefined}>
        <Select
          value={value === areaId ? '' : value}
          onChange={(e) => onChange(e.target.value || areaId)}
          disabled={subAreas.length === 0}
        >
          <option value="">{subAreas.length === 0 ? '—' : 'Directamente en el área'}</option>
          {subAreas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
