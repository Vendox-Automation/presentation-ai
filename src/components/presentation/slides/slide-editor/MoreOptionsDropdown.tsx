"use client";

import { Copy, MoreVertical, Trash2 } from "lucide-react";

import { PRESENTATION_PORTAL_CONTENT_CLASS } from "@/components/presentation/overlay-layers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSlideEditorContext } from "./SlideEditorContext";

export function MoreOptionsDropdown() {
  const {
    isMenuOpen,
    setIsMenuOpen,
    setShowDeleteConfirm,
    onDuplicate,
    dragListeners,
  } = useSlideEditorContext();

  return (
    <DropdownMenu open={isMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8! cursor-grab rounded-full border border-white/20 bg-background/50 shadow backdrop-blur-md transition-all hover:bg-background/80"
          {...dragListeners}
          onClick={() => setIsMenuOpen(true)}
        >
          <MoreVertical className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onInteractOutside={() => setIsMenuOpen(false)}
        align="start"
        className={cn(PRESENTATION_PORTAL_CONTENT_CLASS, "w-48")}
      >
        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
          <Copy className="mr-2 size-4" />
          Duplicate card
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setIsMenuOpen(false);
            setShowDeleteConfirm(true);
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
