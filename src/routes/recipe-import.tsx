import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapSheetRows, type ImportSummary } from "@/lib/recipe-library";
import { importRecipeLibrary, countRecipeLibrary } from "@/lib/recipe-library.functions";

export const Route = createFileRoute("/recipe-import")({
  head: () => ({
    meta: [
      { title: "Recipe Library Import — Smart Pantry" },
      {
        name: "description",
        content:
          "Upload a recipe spreadsheet and add only the new recipes to the shared library. Existing recipes are skipped automatically.",
      },
      { property: "og:title", content: "Recipe Library Import — Smart Pantry" },
      {
        property: "og:description",
        content: "Bulk-import Bangladeshi recipes from Excel with automatic duplicate checking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecipeImportPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
});

function RecipeImportPage() {
  const runImport = useServerFn(importRecipeLibrary);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useQuery({
    queryKey: ["recipe-library-count", summary?.inserted ?? 0],
    queryFn: () => countRecipeLibrary(),
  });

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = book.Sheets[book.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = mapSheetRows(raw);
      if (rows.length === 0) throw new Error("No recipe rows found in this file.");
      setSummary(await runImport({ data: { rows } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Recipe library import</h1>
        <p className="text-sm text-muted-foreground">
          Upload an Excel file with the columns রেসিপির নাম, উপকরণ and প্রস্তুত প্রণালি. Only
          recipes whose name is not already in the database are added.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload spreadsheet</CardTitle>
          <CardDescription>
            Currently in the library: {total.data?.count ?? "…"} recipes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={busy}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          {busy && <p className="text-sm text-muted-foreground">Checking duplicates and importing…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {summary && (
            <dl className="grid grid-cols-2 gap-2 rounded-md border p-4 text-sm">
              <dt>Total recipes in file</dt>
              <dd className="text-right font-medium">{summary.totalInFile}</dd>
              <dt>Already existed (skipped)</dt>
              <dd className="text-right font-medium">{summary.skippedExisting}</dd>
              <dt>Duplicates inside file</dt>
              <dd className="text-right font-medium">{summary.duplicatesInFile}</dd>
              <dt>Rows without a name</dt>
              <dd className="text-right font-medium">{summary.skippedInvalid}</dd>
              <dt>Newly added</dt>
              <dd className="text-right font-medium">{summary.inserted}</dd>
            </dl>
          )}
          <Button variant="outline" onClick={() => total.refetch()} disabled={busy}>
            Refresh count
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
