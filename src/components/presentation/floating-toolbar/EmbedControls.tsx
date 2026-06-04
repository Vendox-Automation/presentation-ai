"use client";

import { Link, Link2Off, Trash2 } from "lucide-react";
import { type TElement } from "platejs";

import {
  extractEmbedId,
  generateEmbedUrl,
  getAllEmbedTypes,
} from "@/components/plate/ui/media-embeds";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FLOATING_TOOLBAR_IGNORE_CLASS } from "./toolbar-interaction";
import { useToolbarContext } from "./ToolbarContext";

export function EmbedControls() {
  const { editor, element, handleNodePropertyUpdate, isMediaEmbedElement } =
    useToolbarContext();

  if (!isMediaEmbedElement || !element) {
    return null;
  }

  const provider =
    typeof element.provider === "string" ? element.provider : "youtube";
  const url = typeof element.url === "string" ? element.url : "";
  const embedTypes = getAllEmbedTypes();

  const handleProviderChange = (nextProvider: string) => {
    handleNodePropertyUpdate("provider", nextProvider);
    handleNodePropertyUpdate("url", "");
    handleNodePropertyUpdate("id", "");
  };

  const normalizeUrl = () => {
    if (!url.trim()) return;

    handleNodePropertyUpdate("url", generateEmbedUrl(url, provider));
    handleNodePropertyUpdate("id", extractEmbedId(url, provider) ?? "");
  };

  const removeUrl = () => {
    handleNodePropertyUpdate("url", "");
    handleNodePropertyUpdate("id", "");
  };

  const deleteEmbed = () => {
    const path = editor.api.findPath(element as TElement);
    if (!path) return;
    editor.tf.removeNodes({ at: path });
  };

  return (
    <>
      <ToolbarGroup>
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger
            className={`${FLOATING_TOOLBAR_IGNORE_CLASS} h-8 w-34 border-none bg-transparent px-2 text-xs shadow-none`}
          >
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className={FLOATING_TOOLBAR_IGNORE_CLASS}>
            {embedTypes.map(({ type, config }) => (
              <SelectItem key={type} value={type}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToolbarButton
          disabled={!url.trim()}
          onClick={normalizeUrl}
          size="sm"
          tooltip="Normalize Embed Link"
        >
          <Link className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          disabled={!url.trim()}
          onClick={removeUrl}
          size="sm"
          tooltip="Remove Embed Link"
        >
          <Link2Off className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          onClick={deleteEmbed}
          size="sm"
          tooltip="Delete Embed"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>
    </>
  );
}
