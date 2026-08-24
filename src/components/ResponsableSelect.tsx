import { useEffect, useMemo, useRef, useState } from 'react';
import { Field, Select } from './ui';
import { isTopLevelUnit, splitOrgUnit, type OrgUnitOption, type UserOption } from '../types/domain';

/**
 * Pseudo-área listing staff with no organigrama placement. Without it those
 * accounts would be unreachable through the cascade — assignable before this
 * feature existed, invisible after it — so the option appears only while such
 * staff actually exist, and disappears once every account is placed.
 */
const UNPLACED = 'unplaced';

/**
 * Picks a trámite's responsable by walking the organigrama: área → subárea →
 * persona. The two upper selects are pure navigation — only the person is
 * stored on the trámite, so `value`/`onChange` speak the same
 * `personInChargeId` string the surrounding forms already use.
 *
 * Subárea is never required: staff can sit directly in an área (all of
 * Secretaría Académica does today), and those people show while the subárea
 * select is left on its blank option.
 */
export function ResponsableSelect({
  orgUnits,
  staff,
  value,
  onChange,
  hint,
}: {
  orgUnits: OrgUnitOption[];
  staff: UserOption[];
  value: string;
  onChange: (personInChargeId: string) => void;
  hint?: string;
}) {
  const [areaId, setAreaId] = useState('');
  const [subAreaId, setSubAreaId] = useState('');

  // Which `value` the selects were last derived from. Set on every user
  // interaction too, so picking an área (which clears the person) doesn't let
  // the sync effect below immediately undo the pick.
  const syncedFor = useRef<string | null>(null);

  const areas = useMemo(() => orgUnits.filter(isTopLevelUnit), [orgUnits]);

  const subAreas = useMemo(
    () => (areaId && areaId !== UNPLACED ? orgUnits.filter((u) => u.parentId === Number(areaId)) : []),
    [orgUnits, areaId],
  );

  const hasUnplacedStaff = useMemo(() => staff.some((u) => u.orgUnitId === null), [staff]);

  const people = useMemo(() => {
    if (!areaId) return [];
    if (areaId === UNPLACED) return staff.filter((u) => u.orgUnitId === null);
    // Blank subárea means "directly in the área", not "any subárea" — a
    // trámite is assigned to one specific box, never to a whole branch.
    const unitId = Number(subAreaId || areaId);
    return staff.filter((u) => u.orgUnitId === unitId);
  }, [staff, areaId, subAreaId]);

  // Opening an existing trámite hands us a person, not an área — walk back up
  // from their placement so both selects show where that person sits.
  useEffect(() => {
    if (orgUnits.length === 0 || syncedFor.current === value) return;
    syncedFor.current = value;

    if (!value) {
      setAreaId('');
      setSubAreaId('');
      return;
    }

    const person = staff.find((u) => String(u.id) === value);
    if (!person) return;

    if (person.orgUnitId === null) {
      setAreaId(UNPLACED);
      setSubAreaId('');
      return;
    }

    const { areaId: nextArea, subAreaId: nextSub } = splitOrgUnit(person.orgUnitId, orgUnits);
    if (!nextArea) return;
    setAreaId(nextArea);
    setSubAreaId(nextSub);
  }, [value, staff, orgUnits]);

  /** Narrowing the branch invalidates whoever was picked under the old one. */
  function narrow(next: () => void) {
    next();
    syncedFor.current = '';
    onChange('');
  }

  return (
    <div className="col-span-2 grid grid-cols-3 gap-4 rounded-sm border border-line bg-canvas/60 p-3">
      <Field label="Área">
        <Select
          value={areaId}
          onChange={(e) =>
            narrow(() => {
              setAreaId(e.target.value);
              setSubAreaId('');
            })
          }
        >
          <option value="">Sin asignar</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          {hasUnplacedStaff && <option value={UNPLACED}>(Sin área asignada)</option>}
        </Select>
      </Field>

      <Field label="Subárea">
        <Select
          value={subAreaId}
          onChange={(e) => narrow(() => setSubAreaId(e.target.value))}
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

      <Field label="Responsable" hint={hint}>
        <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={!areaId}>
          <option value="">{!areaId ? '—' : people.length === 0 ? 'Nadie en esta área' : 'Sin asignar'}</option>
          {people.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
