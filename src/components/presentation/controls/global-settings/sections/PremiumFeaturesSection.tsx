"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { SubscriptionModal } from "../../SubscriptionModal";

export function PremiumFeaturesSection() {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const handlePremiumFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSubscriptionModalOpen(true);
  };
  return (
    <>
      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Animations</Label>
        <div
          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
          onClick={handlePremiumFeatureClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">Enable animations</span>
            <span className="flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              <span>👑</span> PRO
            </span>
          </div>
          <div className="pointer-events-none">
            <input
              aria-label="premium features section control"
              type="checkbox"
              className="sr-only"
            />
            <div className="relative h-6 w-11 rounded-full bg-muted">
              <div className="absolute top-1 left-1 size-4 rounded-full bg-background transition-transform" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Branding</Label>
        <div
          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
          onClick={handlePremiumFeatureClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">Remove ALLWEONE® branding</span>
            <span className="flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              <span>👑</span> PRO
            </span>
          </div>
          <div className="pointer-events-none">
            <input
              aria-label="premium features section control"
              type="checkbox"
              className="sr-only"
            />
            <div className="relative h-6 w-11 rounded-full bg-muted">
              <div className="absolute top-1 left-1 size-4 rounded-full bg-background transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
