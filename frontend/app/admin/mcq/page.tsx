"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { mcqQuestionAdminSchema, type MCQQuestionAdminInput } from "@tech-survivor/shared";
import type { MCQQuestion } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { downloadJson } from "@/lib/download";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Modal } from "@/components/admin/modal";

const EMPTY_QUESTION: MCQQuestionAdminInput = {
  question: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 1,
  negativeMarks: 0,
  explanation: "",
  category: "",
  difficulty: "medium",
  active: true,
};

function useMcqQuestions() {
  return useQuery({
    queryKey: ["admin", "mcq"],
    queryFn: () => apiClient.get<MCQQuestion[]>("/admin/mcq"),
  });
}

function QuestionForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: MCQQuestion | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MCQQuestionAdminInput>({
    resolver: zodResolver(mcqQuestionAdminSchema),
    defaultValues: initial
      ? {
          question: initial.question,
          options: initial.options,
          correctOptionIndex: initial.correctOptionIndex,
          marks: initial.marks,
          negativeMarks: initial.negativeMarks,
          explanation: initial.explanation,
          category: initial.category,
          difficulty: initial.difficulty,
          active: initial.active,
        }
      : EMPTY_QUESTION,
  });

  const mutation = useMutation({
    mutationFn: (values: MCQQuestionAdminInput) =>
      initial
        ? apiClient.patch<MCQQuestion>(`/admin/mcq/${initial.id}`, values)
        : apiClient.post<MCQQuestion>("/admin/mcq", values),
    onSuccess: () => {
      toast.success(initial ? "Question updated" : "Question created");
      queryClient.invalidateQueries({ queryKey: ["admin", "mcq"] });
      onSaved();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Could not save question");
    },
  });

  return (
    <Modal open onClose={onCancel} title={initial ? "Edit Question" : "Add Question"} widthClassName="max-w-2xl">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="question">Question</Label>
          <Textarea id="question" rows={3} {...register("question")} />
          {errors.question && <p className="text-xs text-red-600">{errors.question.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Options (select the correct one)</Label>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                value={i}
                defaultChecked={initial ? initial.correctOptionIndex === i : i === 0}
                {...register("correctOptionIndex", { valueAsNumber: true })}
                aria-label={`Mark option ${i + 1} as correct`}
                className="h-4 w-4 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              />
              <Input placeholder={`Option ${i + 1}`} {...register(`options.${i}`)} />
            </div>
          ))}
          {errors.options && <p className="text-xs text-red-600">All four options are required.</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marks">Marks</Label>
            <Input id="marks" type="number" step="0.5" {...register("marks", { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="negativeMarks">Negative marks</Label>
            <Input id="negativeMarks" type="number" step="0.5" {...register("negativeMarks", { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register("category")} />
            {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
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
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea id="explanation" rows={2} {...register("explanation")} />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            {...register("active")}
          />
          <Label htmlFor="active" className="cursor-pointer">Active (eligible to be assigned to attempts)</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initial ? "Save changes" : "Create question"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function McqPage() {
  const query = useMcqQuestions();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState<"closed" | "create" | MCQQuestion>("closed");
  const [deleteTarget, setDeleteTarget] = useState<MCQQuestion | null>(null);
  const [importErrors, setImportErrors] = useState<{ index: number; error: string }[] | null>(null);
  const [importing, setImporting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete<null>(`/admin/mcq/${id}`),
    onSuccess: () => {
      toast.success("Question deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "mcq"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Could not delete question");
    },
    onSettled: () => setDeleteTarget(null),
  });

  async function handleExport() {
    try {
      const data = await apiClient.get<MCQQuestion[]>("/admin/mcq/export");
      downloadJson(`mcq-questions-${new Date().toISOString().slice(0, 10)}.json`, data);
      toast.success(`Exported ${data.length} question(s)`);
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
      const questions = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { questions?: unknown[] })?.questions)
          ? (parsed as { questions: unknown[] }).questions
          : null;
      if (!questions) {
        toast.error("File must be a JSON array of questions, or an object with a \"questions\" array.");
        return;
      }
      const result = await apiClient.post<{ created: number; errors: { index: number; error: string }[] }>(
        "/admin/mcq/import",
        { questions },
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "mcq"] });
      setImportErrors(result.errors.length > 0 ? result.errors : null);
      if (result.created > 0) toast.success(`Imported ${result.created} question(s)`);
      if (result.errors.length > 0) toast.error(`${result.errors.length} row(s) failed to import`);
      else if (result.created === 0) toast.error("No questions were imported.");
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
          <h1 className="text-2xl font-bold text-navy-900">MCQ Question Bank</h1>
          <p className="text-sm text-slate-500">Manage Round 1 questions, including the correct answer key.</p>
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
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Question
          </Button>
        </div>
      </div>

      {importErrors && (
        <Alert variant="error" title={`${importErrors.length} row(s) failed to import`}>
          <ul className="mt-1 list-disc pl-5">
            {importErrors.map((e) => (
              <li key={e.index}>
                Row {e.index + 1}: {e.error}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {query.isError && <Alert variant="error">Could not load questions.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{query.data.length} question(s)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Question</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Difficulty</th>
                  <th scope="col" className="px-4 py-3">Marks</th>
                  <th scope="col" className="px-4 py-3">Correct Answer</th>
                  <th scope="col" className="px-4 py-3">Active</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No questions yet.</td>
                  </tr>
                )}
                {query.data.map((q) => (
                  <tr key={q.id}>
                    <td className="max-w-xs px-4 py-3 text-navy-900">
                      <span className="line-clamp-2">{q.question}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{q.category}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{q.difficulty}</td>
                    <td className="px-4 py-3 text-slate-600">
                      +{q.marks} / -{q.negativeMarks}
                    </td>
                    <td className="max-w-[16rem] px-4 py-3 text-slate-600">{q.options[q.correctOptionIndex] ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={q.active ? "success" : "secondary"}>{q.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setFormState(q)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(q)}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {formState !== "closed" && (
        <QuestionForm
          initial={formState === "create" ? null : formState}
          onCancel={() => setFormState("closed")}
          onSaved={() => setFormState("closed")}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this question?"
          description="This permanently removes it from the question bank. It cannot be undone."
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
