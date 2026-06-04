"use client";

import { GitBranch, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfographicItemList } from "./item-list";
import { InfographicTreeEditor } from "./tree-editor";
import { type EditableInfographicData } from "./types";
import { countNestedItems } from "./utils";

interface InfographicDataEditorProps {
  data: EditableInfographicData;
  onChange: (data: EditableInfographicData) => void;
}

export function InfographicDataEditor({
  data,
  onChange,
}: InfographicDataEditorProps) {
  const isHierarchy = data.sourceField === "root";
  const isCompare = data.sourceField === "compares";
  const showRelations = data.sourceField === "nodes";

  const updateData = (patch: Partial<EditableInfographicData>) => {
    onChange({ ...data, ...patch });
  };

  const relations = data.relations ?? [];

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header Section */}
      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            General Properties
          </h3>
          <p className="text-xs text-muted-foreground">
            Basic information about your infographic.
          </p>
        </div>

        <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="infographic-title"
              className="text-xs text-muted-foreground"
            >
              TITLE
            </Label>
            <Input
              id="infographic-title"
              value={data.title ?? ""}
              onChange={(event) => updateData({ title: event.target.value })}
              placeholder="e.g. Q3 Performance Summary"
              className="bg-background/50 font-medium"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="infographic-description"
              className="text-xs text-muted-foreground"
            >
              DESCRIPTION
            </Label>
            <Textarea
              id="infographic-description"
              value={data.desc ?? ""}
              onChange={(event) => updateData({ desc: event.target.value })}
              placeholder="Provide a brief context or subtitle..."
              className="min-h-20 resize-none bg-background/50 leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Data Structure
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure items, hierarchies, and values for the diagram.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 font-medium text-muted-foreground">
              Type: {data.sourceField}
            </span>
            <span className="flex items-center rounded-full border border-border/50 bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
              {countNestedItems(data.items)} Item(s)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          {isHierarchy || isCompare ? (
            <InfographicTreeEditor
              items={data.items}
              variant={isCompare ? "compare" : "hierarchy"}
              onChange={(items) => updateData({ items })}
            />
          ) : (
            <InfographicItemList
              items={data.items}
              mode={data.sourceField}
              onChange={(items) => updateData({ items })}
            />
          )}
        </div>
      </section>

      {showRelations ? (
        <RelationEditor
          relations={relations}
          onChange={(nextRelations) => updateData({ relations: nextRelations })}
        />
      ) : null}
    </div>
  );
}

function RelationEditor({
  relations,
  onChange,
}: {
  relations: string[];
  onChange: (relations: string[]) => void;
}) {
  const updateRelation = (index: number, value: string) => {
    onChange(
      relations.map((relation, relationIndex) =>
        relationIndex === index ? value : relation,
      ),
    );
  };

  const removeRelation = (index: number) => {
    onChange(relations.filter((_, relationIndex) => relationIndex !== index));
  };

  const addRelation = () => {
    onChange([...relations, "node-1 -> node-2"]);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <GitBranch className="size-4" />
            Relations
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect node ids with arrows, labels, or plain lines.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addRelation}
          className="gap-2"
        >
          <Plus className="size-3.5" />
          Add Relation
        </Button>
      </div>

      <div className="space-y-3">
        {relations.map((relation, index) => (
          <div
            key={`relation-${index}`}
            className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border border-border/60 bg-card p-2 shadow-sm transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring hover:bg-muted/20"
          >
            <Input
              value={relation}
              onChange={(event) => updateRelation(index, event.target.value)}
              placeholder="source - label -> target"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground opacity-50 transition-opacity hover:text-destructive group-hover:opacity-100"
              onClick={() => removeRelation(index)}
              aria-label="Remove relation"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {relations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
            No relations defined yet. Add one to connect nodes.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export * from "./types";
