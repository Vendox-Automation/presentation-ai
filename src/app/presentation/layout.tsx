import type React from "react";

import PresentationHeader from "@/components/presentation/core/PresentationHeader";
import { PresentationThemeProvider } from "@/components/presentation/providers/PresentationThemeProvider";

export default async function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PresentationThemeProvider>
      <div className="flex h-screen w-screen flex-col supports-[(height:100dvh)]:h-dvh">
        <PresentationHeader />
        <main className="relative flex flex-1 overflow-hidden">
          <div className="sheet-container h-full max-h-full flex-1 place-items-center overflow-x-clip overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </PresentationThemeProvider>
  );
}
