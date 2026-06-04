"use client";

import { ColumnItemPlugin, ColumnPlugin } from "@platejs/layout/react";

import {
  PresentationColumnElement,
  PresentationColumnGroupElement,
} from "./presentation-column-elements";

export const PresentationColumnKit = [
  ColumnPlugin.withComponent(PresentationColumnGroupElement),
  ColumnItemPlugin.withComponent(PresentationColumnElement),
];
