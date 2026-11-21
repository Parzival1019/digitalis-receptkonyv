import { Check, CheckCheck, Loader2, Pencil, Plus, ShoppingBasket, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COMMON_UNITS } from '../../../shared/constants';
import { shoppingItemCreateSchema } from '../../../shared/schemas';
import type { ShoppingListItem } from '../../../shared/types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { useToast } from '../components/Toast';
import { useAsync } from '../hooks/useAsync';
import { api, errorMessage } from '../lib/api';
import { useAppData } from '../lib/AppData';
import { formatAmount } from '../lib/format';

function parseQuantity(value: string): number | null {
  const v = value.trim().replace(',', '.');
  return v === '' ? null : Number(v);
}

/** Tételek rendezése: a nem kipipáltak elöl, név szerint. */
function sortItems(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort(
    (a, b) => Number(a.isChecked) - Number(b.isChecked) || a.name.localeCompare(b.name, 'hu') || a.id - b.id,
  );
}

export function ShoppingListPage() {
  const toast = useToast();
  const { refreshStats } = useAppData();
  const list = useAsync(() => api.shoppingList(), []);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<null | 'clear' | 'checked'>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const items = list.data ?? [];
  const checkedCount = items.filter((i) => i.isChecked).length;

  function replaceItem(item: ShoppingListItem) {
    list.setData((prev) => sortItems((prev ?? []).map((i) => (i.id === item.id ? item : i))));
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const parsed = shoppingItemCreateSchema.safeParse({ name, quantity: parseQuantity(quantity), unit });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Érvénytelen adat.');
      return;
    }
    setFormError(null);
    setAdding(true);
    try {
      const { item, merged } = await api.addShoppingItem(parsed.data);
      list.setData((prev) =>
        sortItems(merged ? (prev ?? []).map((i) => (i.id === item.id ? item : i)) : [...(prev ?? []), item]),
      );
      toast.success(merged ? `„${item.name}” mennyisége összevonva.` : `„${item.name}” hozzáadva a listához.`);
      setName('');
      setQuantity('');
      setUnit('');
      refreshStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function toggle(item: ShoppingListItem) {
    replaceItem({ ...item, isChecked: !item.isChecked }); // optimista frissítés
    try {
      replaceItem(await api.updateShoppingItem(item.id, { isChecked: !item.isChecked }));
      refreshStats();
    } catch (err) {
      replaceItem(item);
      toast.error(errorMessage(err));
    }
  }

  async function remove(item: ShoppingListItem) {
    try {
      await api.deleteShoppingItem(item.id);
      list.setData((prev) => prev?.filter((i) => i.id !== item.id));
      toast.success(`„${item.name}” törölve.`);
      refreshStats();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function runBulk() {
    setBulkBusy(true);
    try {
      if (confirm === 'clear') {
        const { deleted } = await api.clearShoppingList();
        list.setData(() => []);
        toast.success(`A lista kiürítve (${deleted} tétel törölve).`);
      } else {
        const { deleted } = await api.deleteCheckedItems();
        list.setData((prev) => prev?.filter((i) => !i.isChecked));
        toast.success(`${deleted} kipipált tétel eltávolítva.`);
      }
      refreshStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBulkBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Bevásárlólista</h1>
        <p className="mt-1 text-ink-500">
          Recept oldaláról egy kattintással hozzáadhatod a hozzávalókat – az azonos tételeket automatikusan összevonjuk.
        </p>
      </div>

      {/* Új tétel */}
      <form onSubmit={addItem} className="card p-4 sm:p-5" noValidate>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
          <input
            className={`input col-span-2 sm:col-span-1 ${formError ? 'input-error' : ''}`}
            placeholder="Új tétel, pl. kenyér"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Tétel neve"
            aria-invalid={!!formError}
          />
          <input
            className="input"
            inputMode="decimal"
            placeholder="Menny."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-label="Mennyiség"
          />
          <input
            className="input"
            list="shopping-units"
            placeholder="Egység"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Mértékegység"
          />
          <button type="submit" className="btn-primary col-span-2 sm:col-span-1" disabled={adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Hozzáadás
          </button>
        </div>
        <datalist id="shopping-units">
          {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
        </datalist>
        {formError && <p className="mt-2 text-sm text-red-600" role="alert">{formError}</p>}
      </form>

      {list.error ? (
        <ErrorState message={errorMessage(list.error)} onRetry={list.reload} />
      ) : !list.data ? (
        <Spinner label="Bevásárlólista betöltése…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="A bevásárlólista üres"
          description="Adj hozzá tételt fent, vagy egy recept oldalán kattints a „Bevásárlólistára” gombra."
          action={<Link to="/receptek" className="btn-primary">Receptek böngészése</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-5 py-4">
            <div className="min-w-40 flex-1">
              <p className="text-sm font-medium text-ink-700">
                {checkedCount} / {items.length} tétel megvásárolva
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full rounded-full bg-sage-500 transition-all duration-500"
                  style={{ width: `${(checkedCount / items.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => setConfirm('checked')} disabled={checkedCount === 0}>
                <CheckCheck className="size-4" /> Kipipáltak törlése
              </button>
              <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setConfirm('clear')}>
                <Trash2 className="size-4" /> Lista kiürítése
              </button>
            </div>
          </div>
          <ul className="divide-y divide-cream-200">
            {items.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={toggle} onDelete={remove} onSaved={replaceItem} />
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'clear' ? 'Lista kiürítése' : 'Kipipált tételek törlése'}
        message={
          confirm === 'clear'
            ? `Biztosan törlöd mind a(z) ${items.length} tételt a bevásárlólistáról?`
            : `Biztosan eltávolítod a(z) ${checkedCount} kipipált tételt?`
        }
        confirmLabel={confirm === 'clear' ? 'Kiürítés' : 'Eltávolítás'}
        loading={bulkBusy}
        onConfirm={runBulk}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
  onSaved,
}: {
  item: ShoppingListItem;
  onToggle: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
  onSaved: (item: ShoppingListItem) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity === null ? '' : String(item.quantity).replace('.', ','));
  const [unit, setUnit] = useState(item.unit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setName(item.name);
    setQuantity(item.quantity === null ? '' : String(item.quantity).replace('.', ','));
    setUnit(item.unit);
    setError(null);
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = shoppingItemCreateSchema.safeParse({ name, quantity: parseQuantity(quantity), unit });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Érvénytelen adat.');
      return;
    }
    setSaving(true);
    try {
      onSaved(await api.updateShoppingItem(item.id, parsed.data));
      toast.success('Tétel módosítva.');
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <li className="bg-sage-50/50 px-5 py-3">
        <form onSubmit={save} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 sm:grid-cols-[1fr_6rem_6rem_auto_auto]" noValidate>
          <input
            className={`input col-span-4 sm:col-span-1 ${error ? 'input-error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Tétel neve"
            autoFocus
          />
          <input className="input" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Menny." aria-label="Mennyiség" />
          <input className="input" list="shopping-units" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Egység" aria-label="Mértékegység" />
          <button type="submit" className="btn-primary px-3" disabled={saving} aria-label="Mentés">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          </button>
          <button type="button" className="btn-ghost px-3" onClick={() => setEditing(false)} aria-label="Mégse">
            <X className="size-4" />
          </button>
        </form>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-5 py-3 transition hover:bg-cream-50">
      <button
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={item.isChecked}
        aria-label={`${item.name} megvásárolva`}
        className={`flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
          item.isChecked ? 'border-sage-500 bg-sage-500 text-white' : 'border-cream-300 hover:border-sage-400'
        }`}
      >
        {item.isChecked && <Check className="size-4" strokeWidth={3} />}
      </button>
      <span className={`flex-1 transition ${item.isChecked ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
        {item.name}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${item.isChecked ? 'text-ink-400' : 'text-ink-600'}`}>
        {formatAmount(item.quantity, item.unit)}
      </span>
      <div className="flex gap-1 sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button className="btn-ghost p-2" onClick={startEdit} aria-label={`${item.name} szerkesztése`}>
          <Pencil className="size-4" />
        </button>
        <button className="btn-ghost p-2 hover:text-red-600" onClick={() => onDelete(item)} aria-label={`${item.name} törlése`}>
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
