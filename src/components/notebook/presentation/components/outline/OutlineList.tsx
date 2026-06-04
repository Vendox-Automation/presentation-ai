import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LayoutGrid, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresentationState } from "@/states/presentation-state";
import {
  getTemplateSelectionIds,
  TEMPLATE_DEFINITIONS,
} from "../../utils/templates";
import { OutlineItem } from "./OutlineItem";
import { OutlineTemplateModal } from "./OutlineTemplateModal";
import { persistOutlineLayoutSelection } from "./persistOutlineLayoutSelection";

interface OutlineItemType {
  id: string;
  title: string;
}

function areItemTitlesEqual(
  items: OutlineItemType[],
  titles: string[],
): boolean {
  return (
    items.length === titles.length &&
    items.every((item, index) => item.title === titles[index])
  );
}

function areDefaultOutlineIds(items: OutlineItemType[]): boolean {
  return items.every((item, index) => item.id === (index + 1).toString());
}

function shouldAdoptPersistedOutlineIds(
  items: OutlineItemType[],
  persistedIds: string[],
): boolean {
  return (
    persistedIds.length === items.length &&
    areDefaultOutlineIds(items) &&
    items.some((item, index) => item.id !== persistedIds[index])
  );
}

function createOutlineItems(
  titles: string[],
  existingItems: OutlineItemType[] = [],
  persistedIds: string[] = [],
): OutlineItemType[] {
  return titles.map((title, index) => ({
    id:
      existingItems[index]?.id ?? persistedIds[index] ?? (index + 1).toString(),
    title,
  }));
}

export function OutlineList() {
  const {
    outline: initialItems,
    setOutline,
    numSlides,
    isGeneratingOutline,
    webSearchEnabled,
    selectedSlideTemplates,
    outlineItemIds,
    outlineTemplateOverrides,
    setOutlineTemplateOverride,
    setOutlineItemIds,
  } = usePresentationState();

  const [items, setItems] = useState<OutlineItemType[]>(() =>
    createOutlineItems(initialItems, [], outlineItemIds),
  );

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [singleModeOutlineId, setSingleModeOutlineId] = useState<string | null>(
    null,
  );

  // Get available templates for dropdown (filtered to selected ones)
  const availableTemplates = useMemo(() => {
    const selectedTemplates: Array<{ id: string; name: string }> = [];
    const selectedTemplateIds = new Set(selectedSlideTemplates);

    for (const template of TEMPLATE_DEFINITIONS) {
      const hasSelectedId = getTemplateSelectionIds(template).some((id) =>
        selectedTemplateIds.has(id),
      );

      if (hasSelectedId) {
        selectedTemplates.push({ id: template.id, name: template.name });
      }
    }

    return selectedTemplates;
  }, [selectedSlideTemplates]);

  useEffect(() => {
    setItems((previousItems) => {
      if (areItemTitlesEqual(previousItems, initialItems)) {
        if (shouldAdoptPersistedOutlineIds(previousItems, outlineItemIds)) {
          return createOutlineItems(initialItems, [], outlineItemIds);
        }

        return previousItems;
      }

      return createOutlineItems(initialItems, previousItems, outlineItemIds);
    });
  }, [initialItems, outlineItemIds]);

  useEffect(() => {
    setOutlineItemIds(items.map((item) => item.id));
  }, [items, setOutlineItemIds]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const syncOutline = useCallback(
    (nextItems: OutlineItemType[]) => {
      setOutline(nextItems.map((item) => item.title));
    },
    [setOutline],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex < 0 || newIndex < 0) {
          return;
        }

        const nextItems = arrayMove(items, oldIndex, newIndex);
        setItems(nextItems);
        syncOutline(nextItems);
      }
    },
    [items, syncOutline],
  );

  const handleTitleChange = useCallback(
    (id: string, newTitle: string) => {
      const nextItems = items.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item,
      );
      setItems(nextItems);
      syncOutline(nextItems);
    },
    [items, syncOutline],
  );

  const handleAddCard = useCallback(() => {
    const newId = crypto.randomUUID();
    const nextItems = [...items, { id: newId, title: "New Card" }];
    setItems(nextItems);
    syncOutline(nextItems);
  }, [items, syncOutline]);

  const handleDeleteCard = useCallback(
    (id: string) => {
      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);
      syncOutline(nextItems);
    },
    [items, syncOutline],
  );

  const handleTemplateChange = useCallback(
    (outlineId: string, templateId: string | null) => {
      setOutlineTemplateOverride(outlineId, templateId);
      void persistOutlineLayoutSelection();
    },
    [setOutlineTemplateOverride],
  );

  const content = useMemo(() => {
    const totalSlides = numSlides;
    const loadedCount = items.length;
    const remainingCount = Math.max(0, totalSlides - loadedCount);

    const showLoadingSkeletons = isGeneratingOutline && remainingCount > 0;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => {
              const selectedTemplateId =
                outlineTemplateOverrides[item.id] ?? null;

              return (
                <OutlineItem
                  key={item.id}
                  id={item.id}
                  index={index + 1}
                  title={item.title}
                  onTitleChange={handleTitleChange}
                  onDelete={handleDeleteCard}
                  showLayoutControl={
                    availableTemplates.length > 0 || selectedTemplateId !== null
                  }
                  selectedTemplateId={selectedTemplateId}
                  onTemplateChange={(templateId) => {
                    handleTemplateChange(item.id, templateId);
                  }}
                  availableTemplates={availableTemplates}
                  disabled={isGeneratingOutline}
                  onOpenTemplateModal={() => {
                    setSingleModeOutlineId(item.id);
                    setIsTemplateModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </SortableContext>
        {/* Show loading skeletons only when actually generating */}
        {showLoadingSkeletons &&
          Array.from({ length: remainingCount }).map((_, index) => (
            <Skeleton key={`loading-${index}`} className="h-16 w-full" />
          ))}
      </DndContext>
    );
  }, [
    items,
    numSlides,
    isGeneratingOutline,
    sensors,
    handleDragEnd,
    handleTitleChange,
    handleDeleteCard,
    outlineTemplateOverrides,
    handleTemplateChange,
    availableTemplates,
  ]);

  const hideOutline =
    webSearchEnabled && items.length === 0 && !isGeneratingOutline;
  if (hideOutline) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-foreground">Outline</h2>
        <div className="flex items-center gap-2">
          {isGeneratingOutline && items.length > 0 && (
            <span className="animate-pulse text-xs text-muted-foreground">
              Generating&hellip;
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSingleModeOutlineId(null);
              setIsTemplateModalOpen(true);
            }}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <LayoutGrid className="size-3.5" />
            Layouts
            {selectedSlideTemplates.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 h-4 px-1 text-[10px]"
              >
                {selectedSlideTemplates.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {content}

      <button
        type="button"
        onClick={handleAddCard}
        disabled={isGeneratingOutline}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-muted/50 py-3 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <Plus size={20} />
        Add card
      </button>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{items.length} cards total</span>
        <span>
          {items.reduce((acc, item) => acc + item.title.length, 0)}/20000
        </span>
      </div>

      <OutlineTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setSingleModeOutlineId(null);
        }}
        mode={singleModeOutlineId ? "single" : "global"}
        outlineId={singleModeOutlineId ?? undefined}
      />
    </div>
  );
}
