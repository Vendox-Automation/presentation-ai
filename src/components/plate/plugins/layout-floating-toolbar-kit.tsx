"use client";

import { createPlatePlugin } from "platejs/react";

import { LayoutFloatingToolbar } from "@/components/presentation/floating-toolbar/LayoutFloatingToolbar";
import { LayoutFloatingToolbarButtons } from "@/components/presentation/floating-toolbar/LayoutFloatingToolbarButtons";

export const LayoutFloatingToolbarKit = [
  createPlatePlugin({
    key: "layout-floating-toolbar",
    render: {
      afterEditable: () => (
        <LayoutFloatingToolbar>
          <LayoutFloatingToolbarButtons />
        </LayoutFloatingToolbar>
      ),
    },
  }),
];
