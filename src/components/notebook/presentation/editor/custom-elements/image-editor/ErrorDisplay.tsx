"use client";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error?: string;
  localError?: string | null;
}

export function ErrorDisplay({ error, localError }: ErrorDisplayProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {localError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
