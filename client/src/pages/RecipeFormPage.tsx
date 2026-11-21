import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { COMMON_UNITS, DIFFICULTIES, DIFFICULTY_LABELS } from '../../../shared/constants';
import { recipeInputSchema, type RecipeInput } from '../../../shared/schemas';
import type { Difficulty, Recipe } from '../../../shared/types';
import { ErrorState, Spinner } from '../components/States';
import { useToast } from '../components/Toast';
import { useAsync } from '../hooks/useAsync';
import { api, ApiError, errorMessage } from '../lib/api';
import { useAppData } from '../lib/AppData';
import { resizeImageToDataUrl } from '../lib/image';

/** Az űrlap belső állapota: a számmezők szövegként, hogy üresen is hagyhatók legyenek. */
interface FormState {
  title: string;
  description: string;
  categoryId: string;
  prepTimeMinutes: string;
  servings: string;
  difficulty: Difficulty | '';
  imageUrl: string;
  isFeatured: boolean;
  ingredients: { key: number; name: string; quantity: string; unit: string }[];
  steps: { key: number; text: string }[];
}

let keySeq = 0;
const nextKey = () => ++keySeq;

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  categoryId: '',
  prepTimeMinutes: '',
  servings: '4',
  difficulty: 'konnyu',
  imageUrl: '',
  isFeatured: false,
  ingredients: [{ key: nextKey(), name: '', quantity: '', unit: '' }],
  steps: [{ key: nextKey(), text: '' }],
});

function fromRecipe(r: Recipe): FormState {
  return {
    title: r.title,
    description: r.description,
    categoryId: String(r.category.id),
    prepTimeMinutes: String(r.prepTimeMinutes),
    servings: String(r.servings),
    difficulty: r.difficulty,
    imageUrl: r.imageUrl ?? '',
    isFeatured: r.isFeatured,
    ingredients: r.ingredients.map((i) => ({
      key: nextKey(),
      name: i.name,
      quantity: i.quantity === null ? '' : String(i.quantity).replace('.', ','),
      unit: i.unit,
    })),
    steps: r.steps.map((s) => ({ key: nextKey(), text: s.instruction })),
  };
}

/** Szövegből szám: elfogadja a magyar tizedesvesszőt is („1,5”). Üres → null. */
function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') return null;
  return Number(trimmed);
}

function toInput(f: FormState): RecipeInput {
  return {
    title: f.title,
    description: f.description,
    categoryId: f.categoryId ? Number(f.categoryId) : (undefined as unknown as number),
    prepTimeMinutes: parseNumber(f.prepTimeMinutes) ?? (undefined as unknown as number),
    servings: parseNumber(f.servings) ?? (undefined as unknown as number),
    difficulty: (f.difficulty || undefined) as Difficulty,
    imageUrl: f.imageUrl || null,
    isFeatured: f.isFeatured,
    // A teljesen üres hozzávaló- és lépéssorokat figyelmen kívül hagyjuk.
    ingredients: f.ingredients
      .filter((i) => i.name.trim() || i.quantity.trim() || i.unit.trim())
      .map((i) => ({ name: i.name, quantity: parseNumber(i.quantity), unit: i.unit })),
    steps: f.steps.map((s) => s.text).filter((t) => t.trim()),
  };
}

type Errors = Record<string, string>;

export function RecipeFormPage() {
  const params = useParams();
  const editId = params.id ? Number(params.id) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshStats } = useAppData();

  const categories = useAsync(() => api.categories(), []);
  const ingredientNames = useAsync(() => api.ingredients(), []);
  const existing = useAsync(() => (editId ? api.recipe(editId) : Promise.resolve(null)), [editId]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (existing.data) setForm(fromRecipe(existing.data));
  }, [existing.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  function updateIngredient(index: number, patch: Partial<FormState['ingredients'][number]>) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((x, i) => (i === index ? { ...x, ...patch } : x)) }));
  }
  function updateStep(index: number, text: string) {
    setForm((f) => ({ ...f, steps: f.steps.map((x, i) => (i === index ? { ...x, text } : x)) }));
  }
  function moveStep(index: number, dir: -1 | 1) {
    setForm((f) => {
      const steps = [...f.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return f;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...f, steps };
    });
  }

  async function onImageFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájl tölthető fel.');
      return;
    }
    setImageBusy(true);
    try {
      set('imageUrl', await resizeImageToDataUrl(file));
    } catch {
      toast.error('A kép feldolgozása nem sikerült.');
    } finally {
      setImageBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = toInput(form);

    // 1. Kliensoldali validáció ugyanazzal a Zod-sémával, amit a szerver is használ.
    const parsed = recipeInputSchema.safeParse(input);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        errs[path] ??= issue.message;
      }
      setErrors(errs);
      toast.error('Kérjük, javítsd a hibásan kitöltött mezőket.');
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    setErrors({});

    // 2. Mentés a szerverre (a szerver is validál).
    setSaving(true);
    try {
      const saved = editId ? await api.updateRecipe(editId, input) : await api.createRecipe(input);
      toast.success(editId ? 'A recept módosításai elmentve.' : 'Az új recept sikeresen elmentve.');
      refreshStats();
      navigate(`/receptek/${saved.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      toast.error(`Mentés sikertelen: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  }

  if (editId && existing.loading && !existing.data) return <Spinner label="Recept betöltése…" />;
  if (existing.error) return <ErrorState message={errorMessage(existing.error)} onRetry={existing.reload} />;

  // Ha a szűrt hozzávalók miatt eltolódnak az indexek, a hibát a sor eredeti
  // indexéhez kell kötni: kiszámoljuk, melyik nem üres sor hányadik.
  let filledIndex = -1;
  const ingredientErrorIndex = form.ingredients.map((i) =>
    i.name.trim() || i.quantity.trim() || i.unit.trim() ? ++filledIndex : -1,
  );
  let stepFilled = -1;
  const stepErrorIndex = form.steps.map((s) => (s.text.trim() ? ++stepFilled : -1));

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-4xl animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={editId ? `/receptek/${editId}` : '/receptek'} className="btn-ghost -ml-2 px-2">
            <ArrowLeft className="size-4" /> Vissza
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900 sm:text-4xl">
            {editId ? 'Recept szerkesztése' : 'Új recept hozzáadása'}
          </h1>
        </div>
      </div>

      {/* Alapadatok */}
      <section className="card space-y-5 p-6">
        <h2 className="text-xl font-semibold">Alapadatok</h2>
        <Field label="Recept neve *" error={errors.title}>
          <input
            className={`input ${errors.title ? 'input-error' : ''}`}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="pl. Nagymama almás pitéje"
            aria-invalid={!!errors.title}
            maxLength={120}
          />
        </Field>
        <Field label="Rövid leírás" error={errors.description} hint={`${form.description.length}/500`}>
          <textarea
            className={`input min-h-24 resize-y ${errors.description ? 'input-error' : ''}`}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Néhány mondat a receptről…"
            aria-invalid={!!errors.description}
            maxLength={500}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Kategória *" error={errors.categoryId}>
            <select
              className={`input ${errors.categoryId ? 'input-error' : ''}`}
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              aria-invalid={!!errors.categoryId}
            >
              <option value="">Válassz…</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Elkészítési idő (perc) *" error={errors.prepTimeMinutes}>
            <input
              className={`input ${errors.prepTimeMinutes ? 'input-error' : ''}`}
              inputMode="numeric"
              value={form.prepTimeMinutes}
              onChange={(e) => set('prepTimeMinutes', e.target.value)}
              placeholder="pl. 45"
              aria-invalid={!!errors.prepTimeMinutes}
            />
          </Field>
          <Field label="Adagok száma *" error={errors.servings}>
            <input
              className={`input ${errors.servings ? 'input-error' : ''}`}
              inputMode="numeric"
              value={form.servings}
              onChange={(e) => set('servings', e.target.value)}
              aria-invalid={!!errors.servings}
            />
          </Field>
          <Field label="Nehézség *" error={errors.difficulty}>
            <select
              className={`input ${errors.difficulty ? 'input-error' : ''}`}
              value={form.difficulty}
              onChange={(e) => set('difficulty', e.target.value as Difficulty)}
              aria-invalid={!!errors.difficulty}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            className="size-4 accent-sage-600"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
          />
          Kiemelt recept (megjelenik a főoldalon)
        </label>
      </section>

      {/* Kép */}
      <section className="card space-y-4 p-6">
        <h2 className="text-xl font-semibold">Kép (opcionális)</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-cream-300 bg-cream-50 sm:w-56">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Előnézet" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="size-10 text-ink-400" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <Field label="Kép URL-je" error={errors.imageUrl}>
              <input
                className={`input ${errors.imageUrl ? 'input-error' : ''}`}
                value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder={form.imageUrl.startsWith('data:') ? 'Feltöltött kép használatban' : 'https://…'}
                aria-invalid={!!errors.imageUrl}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <label className="btn-secondary cursor-pointer">
                {imageBusy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                Kép feltöltése
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    void onImageFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              {form.imageUrl && (
                <button type="button" className="btn-ghost" onClick={() => set('imageUrl', '')}>
                  <X className="size-4" /> Kép eltávolítása
                </button>
              )}
            </div>
            <p className="text-xs text-ink-400">
              A feltöltött képet a böngésző lekicsinyíti, és az adatbázisban tároljuk – internet nélkül is megjelenik.
            </p>
          </div>
        </div>
      </section>

      {/* Hozzávalók */}
      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Hozzávalók *</h2>
          <span className="text-xs text-ink-400">Mennyiség üresen = „ízlés szerint”</span>
        </div>
        {errors.ingredients && <p className="text-sm text-red-600">{errors.ingredients}</p>}
        <datalist id="ingredient-names">
          {ingredientNames.data?.map((n) => <option key={n} value={n} />)}
        </datalist>
        <datalist id="units">
          {COMMON_UNITS.map((u) => <option key={u} value={u} />)}
        </datalist>
        <div className="space-y-3">
          {form.ingredients.map((ing, index) => {
            const ei = ingredientErrorIndex[index];
            const nameErr = ei >= 0 ? errors[`ingredients.${ei}.name`] : undefined;
            const qtyErr = ei >= 0 ? errors[`ingredients.${ei}.quantity`] : undefined;
            const unitErr = ei >= 0 ? errors[`ingredients.${ei}.unit`] : undefined;
            return (
              <div key={ing.key}>
                <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
                  <input
                    className={`input col-span-2 sm:col-span-1 ${nameErr ? 'input-error' : ''}`}
                    list="ingredient-names"
                    placeholder="Hozzávaló neve"
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, { name: e.target.value })}
                    aria-label={`${index + 1}. hozzávaló neve`}
                    aria-invalid={!!nameErr}
                  />
                  <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-2 sm:contents">
                    <input
                      className={`input ${qtyErr ? 'input-error' : ''}`}
                      inputMode="decimal"
                      placeholder="Menny."
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, { quantity: e.target.value })}
                      aria-label={`${index + 1}. hozzávaló mennyisége`}
                      aria-invalid={!!qtyErr}
                    />
                    <input
                      className={`input ${unitErr ? 'input-error' : ''}`}
                      list="units"
                      placeholder="Egység"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                      aria-label={`${index + 1}. hozzávaló mértékegysége`}
                    />
                    <button
                      type="button"
                      className="btn-ghost px-3 text-ink-400 hover:text-red-600"
                      onClick={() => set('ingredients', form.ingredients.filter((_, i) => i !== index))}
                      disabled={form.ingredients.length === 1}
                      aria-label={`${index + 1}. hozzávaló törlése`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {(nameErr || qtyErr || unitErr) && (
                  <p className="mt-1 text-xs text-red-600">{nameErr ?? qtyErr ?? unitErr}</p>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => set('ingredients', [...form.ingredients, { key: nextKey(), name: '', quantity: '', unit: '' }])}
        >
          <Plus className="size-4" /> Hozzávaló hozzáadása
        </button>
      </section>

      {/* Lépések */}
      <section className="card space-y-4 p-6">
        <h2 className="text-xl font-semibold">Elkészítési lépések *</h2>
        {errors.steps && <p className="text-sm text-red-600">{errors.steps}</p>}
        <ol className="space-y-3">
          {form.steps.map((step, index) => {
            const si = stepErrorIndex[index];
            const err = si >= 0 ? errors[`steps.${si}`] : undefined;
            return (
              <li key={step.key} className="flex gap-3">
                <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-800">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    className={`input min-h-20 resize-y ${err ? 'input-error' : ''}`}
                    placeholder="Írd le a lépést…"
                    value={step.text}
                    onChange={(e) => updateStep(index, e.target.value)}
                    aria-label={`${index + 1}. lépés`}
                    aria-invalid={!!err}
                  />
                  {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" className="btn-ghost p-2" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="Lépés feljebb">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" className="btn-ghost p-2" onClick={() => moveStep(index, 1)} disabled={index === form.steps.length - 1} aria-label="Lépés lejjebb">
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost p-2 text-ink-400 hover:text-red-600"
                    onClick={() => set('steps', form.steps.filter((_, i) => i !== index))}
                    disabled={form.steps.length === 1}
                    aria-label={`${index + 1}. lépés törlése`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn-secondary" onClick={() => set('steps', [...form.steps, { key: nextKey(), text: '' }])}>
          <Plus className="size-4" /> Lépés hozzáadása
        </button>
      </section>

      <div className="sticky bottom-20 z-30 flex justify-end gap-2 rounded-2xl border border-cream-200 bg-white/90 p-3 shadow-lift backdrop-blur md:bottom-4">
        <Link to={editId ? `/receptek/${editId}` : '/receptek'} className="btn-secondary">
          Mégse
        </Link>
        <button type="submit" className="btn-primary" disabled={saving || imageBusy}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {editId ? 'Módosítások mentése' : 'Recept mentése'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label flex justify-between">
        {label}
        {hint && <span className="font-normal text-ink-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
