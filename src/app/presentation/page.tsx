"use client";

import { PresentationDashboard } from "@/components/notebook/presentation/components/PresentationDashboard";

export default async function PresentationPage(props: {
  searchParams: Promise<{ format?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialGenerationType =
    searchParams.format === "html" ? "HTML" : "Flow";

  return (
    <PresentationDashboard initialGenerationType={initialGenerationType} />
  );
}
