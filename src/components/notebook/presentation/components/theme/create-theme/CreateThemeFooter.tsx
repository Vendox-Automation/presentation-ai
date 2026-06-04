"use client";

import { ChevronDown, Copy, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type CreateThemeStep } from "./create-theme-types";
import { CreateThemeStepper } from "./CreateThemeStepper";

interface CreateThemeFooterProps {
  currentStep: CreateThemeStep;
  isSubmitting: boolean;
  onStepClick: (step: CreateThemeStep) => void;
  onContinue: () => void;
  onSave?: () => void;
  onSaveAndCreateNew?: () => void;
  onResetCustomization?: () => void;
  isEditing?: boolean;
  isCustomizing?: boolean;
}

export function CreateThemeFooter({
  currentStep,
  isSubmitting,
  onStepClick,
  onContinue,
  onSave,
  onSaveAndCreateNew,
  onResetCustomization,
  isEditing = false,
  isCustomizing = false,
}: CreateThemeFooterProps) {
  const showQuickSave = (isCustomizing || isEditing) && currentStep !== "save";
  const showSaveSplitButton = isCustomizing && currentStep !== "save";
  const saveLabel = isEditing && !isCustomizing ? "Save Edits" : "Save";

  // Get the text for the continue/next button
  const getContinueButtonText = () => {
    if (currentStep === "save") {
      if (isCustomizing) {
        return "Save & Create New";
      }
      return isEditing ? "Save Edits" : "Publish Theme";
    }
    return isCustomizing ? "Next" : "Continue";
  };

  return (
    <div className="flex items-center justify-between border-t border-border p-4">
      <CreateThemeStepper currentStep={currentStep} onStepClick={onStepClick} />

      <div className="flex items-center gap-2">
        {showQuickSave &&
          (showSaveSplitButton ? (
            <ButtonGroup>
              <Button
                type="button"
                onClick={onSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Save className="size-4" />
                {saveLabel}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="bg-blue-600 px-2 text-white hover:bg-blue-700"
                    aria-label="More save options"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4}>
                  <DropdownMenuItem onClick={onSave} disabled={isSubmitting}>
                    <Save className="mr-2 size-4" />
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onSaveAndCreateNew}
                    disabled={isSubmitting}
                  >
                    <Copy className="mr-2 size-4" />
                    Save & Create New
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onResetCustomization}
                    disabled={isSubmitting || !onResetCustomization}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Reset Customization
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          ) : (
            <Button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="size-4" />
              {saveLabel}
            </Button>
          ))}

        {/* Next/Continue button */}
        <Button
          type="button"
          onClick={onContinue}
          disabled={currentStep === "save" && isSubmitting}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {getContinueButtonText()}
          <ChevronDown className="size-4 -rotate-90" />
        </Button>
      </div>
    </div>
  );
}
