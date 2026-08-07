"use client";

import { useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { codingProblemAdminSchema, type CodingProblemAdminInput } from "@tech-survivor/shared";
import type { CodingProblem, CodingProblemPublic } from "@tech-survivor/types";
import { DEFAULT_STARTER_CODE, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@tech-survivor/config";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { downloadJson } from "@/lib/download";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Modal } from "@/components/admin/modal";

const DIFFICULTY_BADGE: Record<CodingProblem["difficulty"], BadgeProps["variant"]> = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
};

const EMPTY_PROBLEM: CodingProblemAdminInput = {
  title: "",
  difficulty: "easy",
  description: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  samples: [{ input: "", expectedOutput: "", explanation: "" }],
  hiddenTestCases: [{ input: "", expectedOutput: "" }],
  starterCode: {},
  supportedLanguages: ["python"],
  points: 100,
  scoringMode: "partial",
  timeLimit: 2,
  memoryLimit: 256,
  comparisonMode: "trimmed",
  floatTolerance: 0.000001,
  active: true,
};

function toFormValues(p: CodingProblem): CodingProblemAdminInput {
  return {
    title: p.title,
    difficulty: p.difficulty,
    description: p.description,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    constraints: p.constraints,
    samples: p.samples,
    hiddenTestCases: p.hiddenTestCases,
    starterCode: p.starterCode,
    supportedLanguages: p.supportedLanguages,
    points: p.points,
    scoringMode: p.scoringMode,
    timeLimit: p.timeLimit,
    memoryLimit: p.memoryLimit,
    comparisonMode: p.comparisonMode,
    floatTolerance: p.floatTolerance,
    active: p.active,
  };
}

function useProblems() {
  return useQuery({
    queryKey: ["admin", "problems"],
    queryFn: () => apiClient.get<CodingProblem[]>("/admin/problems"),
  });
}

function ProblemForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: CodingProblem | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CodingProblemAdminInput>({
    resolver: zodResolver(codingProblemAdminSchema),
    defaultValues: initial ? toFormValues(initial) : EMPTY_PROBLEM,
  });

  const samples = useFieldArray({ control, name: "samples" });
  const hidden = useFieldArray({ control, name: "hiddenTestCases" });
  const selectedLanguages = watch("supportedLanguages") ?? [];

  const mutation = useMutation({
    mutationFn: (values: CodingProblemAdminInput) =>
      initial
        ? apiClient.patch<CodingProblem>(`/admin/problems/${initial.id}`, values)
        : apiClient.post<CodingProblem>("/admin/problems", values),
    onSuccess: () => {
      toast.success(initial ? "Problem updated" : "Problem created");
      queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
      onSaved();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Could not save problem");
    },
  });

  function toggleLanguage(lang: string, checked: boolean) {
    const next = checked
      ? [...selectedLanguages, lang]
      : selectedLanguages.filter((l) => l !== lang);
    setValue("supportedLanguages", next as CodingProblemAdminInput["supportedLanguages"], { shouldValidate: true });
  }

  return (
    <Modal open onClose={onCancel} title={initial ? "Edit Problem" : "Add Problem"} widthClassName="max-w-4xl">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select id="difficulty" {...register("difficulty")}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inputFormat">Input format</Label>
            <Textarea id="inputFormat" rows={3} {...register("inputFormat")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outputFormat">Output format</Label>
            <Textarea id="outputFormat" rows={3} {...register("outputFormat")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea id="constraints" rows={3} {...register("constraints")} />
          </div>
        </div>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Sample test cases (shown to participants)</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => samples.append({ input: "", expectedOutput: "", explanation: "" })}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add sample
            </Button>
          </div>
          {errors.samples?.message && <p className="text-xs text-red-600">{errors.samples.message}</p>}
          {samples.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`samples.${index}.input`}>Input</Label>
                <Textarea id={`samples.${index}.input`} rows={2} {...register(`samples.${index}.input`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`samples.${index}.expectedOutput`}>Expected output</Label>
                <Textarea id={`samples.${index}.expectedOutput`} rows={2} {...register(`samples.${index}.expectedOutput`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`samples.${index}.explanation`}>Explanation (optional)</Label>
                <div className="flex gap-2">
                  <Textarea id={`samples.${index}.explanation`} rows={2} {...register(`samples.${index}.explanation`)} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove sample" onClick={() => samples.remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900">Hidden test cases (judging only, never shown)</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => hidden.append({ input: "", expectedOutput: "" })}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add hidden case
            </Button>
          </div>
          {errors.hiddenTestCases?.message && <p className="text-xs text-red-600">{errors.hiddenTestCases.message}</p>}
          {hidden.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`hiddenTestCases.${index}.input`}>Input</Label>
                <Textarea id={`hiddenTestCases.${index}.input`} rows={2} {...register(`hiddenTestCases.${index}.input`)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`hiddenTestCases.${index}.expectedOutput`}>Expected output</Label>
                <div className="flex gap-2">
                  <Textarea id={`hiddenTestCases.${index}.expectedOutput`} rows={2} {...register(`hiddenTestCases.${index}.expectedOutput`)} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove hidden case" onClick={() => hidden.remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-navy-900">Supported languages</h3>
          <div className="flex flex-wrap gap-4">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={(e) => toggleLanguage(lang, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                />
                {LANGUAGE_LABELS[lang]}
              </label>
            ))}
          </div>
          {errors.supportedLanguages && <p className="text-xs text-red-600">Select at least one language.</p>}

          <div className="flex flex-col gap-3">
            {selectedLanguages.map((lang) => (
              <div key={lang} className="flex flex-col gap-1">
                <Label htmlFor={`starterCode.${lang}`}>Starter code - {LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS]}</Label>
                <Textarea
                  id={`starterCode.${lang}`}
                  rows={5}
                  className="font-mono text-xs"
                  placeholder={DEFAULT_STARTER_CODE[lang as keyof typeof DEFAULT_STARTER_CODE]}
                  {...register(`starterCode.${lang}`)}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="points">Points</Label>
            <Input id="points" type="number" {...register("points", { valueAsNumber: true })} />
            {errors.points && <p className="text-xs text-red-600">{errors.points.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scoringMode">Scoring mode</Label>
            <Select id="scoringMode" {...register("scoringMode")}>
              <option value="partial">Partial credit</option>
              <option value="all_or_nothing">All or nothing</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comparisonMode">Output comparison</Label>
            <Select id="comparisonMode" {...register("comparisonMode")}>
              <option value="exact">Exact</option>
              <option value="trimmed">Trimmed</option>
              <option value="case_insensitive">Case insensitive</option>
              <option value="float_tolerance">Float tolerance</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timeLimit">Time limit (seconds)</Label>
            <Input id="timeLimit" type="number" step="0.5" {...register("timeLimit", { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memoryLimit">Memory limit (MB)</Label>
            <Input id="memoryLimit" type="number" {...register("memoryLimit", { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="floatTolerance">Float tolerance</Label>
            <Input id="floatTolerance" type="number" step="0.000001" {...register("floatTolerance", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            {...register("active")}
          />
          <Label htmlFor="active" className="cursor-pointer">Active (visible to participants during Round 2)</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initial ? "Save changes" : "Create problem"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ problemId, onClose }: { problemId: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["admin", "problems", problemId, "preview"],
    queryFn: () => apiClient.get<CodingProblemPublic>(`/admin/problems/${problemId}/preview`),
  });

  return (
    <Modal open onClose={onClose} title="Participant Preview" widthClassName="max-w-3xl">
      {query.isLoading && <Skeleton className="h-64 w-full" />}
      {query.isError && <Alert variant="error">Could not load preview.</Alert>}
      {query.data && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-navy-900">{query.data.title}</h3>
            <Badge variant={DIFFICULTY_BADGE[query.data.difficulty]}>{query.data.difficulty}</Badge>
            <span className="text-sm text-slate-500">{query.data.points} pts</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{query.data.description}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Input format</h4>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{query.data.inputFormat || "—"}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500">Output format</h4>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{query.data.outputFormat || "—"}</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500">Constraints</h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{query.data.constraints || "—"}</p>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Samples</h4>
            <div className="flex flex-col gap-2">
              {query.data.samples.map((s) => (
                <div key={s.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p><span className="font-medium">Input:</span> <span className="font-mono">{s.input}</span></p>
                  <p><span className="font-medium">Output:</span> <span className="font-mono">{s.expectedOutput}</span></p>
                  {s.explanation && <p className="text-slate-500">{s.explanation}</p>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Starter code</h4>
            <div className="flex flex-col gap-2">
              {query.data.supportedLanguages.map((lang) => (
                <div key={lang}>
                  <p className="text-xs font-medium text-slate-500">{LANGUAGE_LABELS[lang]}</p>
                  <pre className="overflow-x-auto rounded-md bg-navy-900 p-3 text-xs text-slate-100">
                    {query.data.starterCode[lang] ?? ""}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function ProblemsPage() {
  const query = useProblems();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState<"closed" | "create" | CodingProblem>("closed");
  const [deleteTarget, setDeleteTarget] = useState<CodingProblem | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<{ index: number; error: string }[] | null>(null);
  const [importing, setImporting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete<null>(`/admin/problems/${id}`),
    onSuccess: () => {
      toast.success("Problem deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not delete problem"),
    onSettled: () => setDeleteTarget(null),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post<CodingProblem>(`/admin/problems/${id}/duplicate`),
    onSuccess: () => {
      toast.success("Problem duplicated (created as inactive)");
      queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not duplicate problem"),
  });

  async function handleExport() {
    try {
      const data = await apiClient.get<CodingProblem[]>("/admin/problems/export");
      downloadJson(`coding-problems-${new Date().toISOString().slice(0, 10)}.json`, data);
      toast.success(`Exported ${data.length} problem(s)`);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Export failed");
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportErrors(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const problems = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { problems?: unknown[] })?.problems)
          ? (parsed as { problems: unknown[] }).problems
          : null;
      if (!problems) {
        toast.error("File must be a JSON array of problems, or an object with a \"problems\" array.");
        return;
      }
      const result = await apiClient.post<{ created: number; errors: { index: number; error: string }[] }>(
        "/admin/problems/import",
        { problems },
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "problems"] });
      setImportErrors(result.errors.length > 0 ? result.errors : null);
      if (result.created > 0) toast.success(`Imported ${result.created} problem(s)`);
      if (result.errors.length > 0) toast.error(`${result.errors.length} row(s) failed to import`);
      else if (result.created === 0) toast.error("No problems were imported.");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Import failed - check the file is valid JSON.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Coding Problems</h1>
          <p className="text-sm text-slate-500">Manage Round 2 problems, test cases, and judging settings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4" aria-hidden="true" /> {importing ? "Importing..." : "Import JSON"}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden="true" /> Export JSON
          </Button>
          <Button variant="primary" onClick={() => setFormState("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Problem
          </Button>
        </div>
      </div>

      {importErrors && (
        <Alert variant="error" title={`${importErrors.length} row(s) failed to import`}>
          <ul className="mt-1 list-disc pl-5">
            {importErrors.map((e) => (
              <li key={e.index}>Row {e.index + 1}: {e.error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {query.isError && <Alert variant="error">Could not load problems.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {query.data.length === 0 && <p className="text-sm text-slate-500">No problems yet.</p>}
          {query.data.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={DIFFICULTY_BADGE[p.difficulty]}>{p.difficulty}</Badge>
                    <Badge variant={p.active ? "success" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Points</dt>
                    <dd className="font-medium text-navy-900">{p.points}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Languages</dt>
                    <dd className="font-medium text-navy-900">{p.supportedLanguages.length}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewId(p.id)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFormState(p)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateMutation.mutate(p.id)}
                    disabled={duplicateMutation.isPending}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Duplicate
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {formState !== "closed" && (
        <ProblemForm
          initial={formState === "create" ? null : formState}
          onCancel={() => setFormState("closed")}
          onSaved={() => setFormState("closed")}
        />
      )}

      {previewId && <PreviewModal problemId={previewId} onClose={() => setPreviewId(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this problem?"
          description="This permanently removes it, including its hidden test cases. It cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
