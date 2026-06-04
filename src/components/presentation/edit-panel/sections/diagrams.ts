"use client";

import { type TElement } from "platejs";

import { ANTV_INFOGRAPHIC } from "@/components/notebook/presentation/editor/lib";
import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";
import { INFOGRAPHIC_CATEGORIES } from "@/constants/antv-templates";

export type DiagramItem = {
  key: string;
  label: string;
  categoryKey: string;
  categoryName: string;
  templateId: string;
  syntax: string;
  node: TElement;
};

export type DiagramCategory = {
  key: string;
  name: string;
  items: DiagramItem[];
};

const DEFAULT_THEME = `theme
  colorBg transparent
  palette
    - #2563eb
    - #14b8a6
    - #f97316
    - #8b5cf6
    - #22c55e`;

function titleCaseTemplate(templateId: string): string {
  return templateId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createInfographicNode(syntax: string): TElement {
  return {
    type: ANTV_INFOGRAPHIC,
    syntax,
    isLoading: false,
    align: "center",
    width: "100%",
    children: [{ text: "" }],
  } satisfies TAntvInfographicElement;
}

function createItemsData(title: string): string {
  return `data
  title ${title}
  desc A practical workflow from idea to outcome
  items
    - label Discover
      desc Frame the need and collect the right signals
      value 24
      icon mdi/magnify
    - label Design
      desc Shape options into a clear execution path
      value 42
      icon mdi/vector-square
    - label Build
      desc Produce the core deliverable with focused effort
      value 68
      icon mdi/hammer-wrench
    - label Launch
      desc Release, measure, and refine the result
      value 86
      icon mdi/rocket-launch`;
}

function createCompareData(title: string): string {
  return `data
  title ${title}
  desc Choose the path that best fits the work
  compares
    - label Current
      desc Existing way of working
      icon mdi/history
      children
        - label Manual
          desc Repeated handoffs slow delivery
          icon mdi/hand-back-left
        - label Fragmented
          desc Context is split across tools
          icon mdi/call-split
    - label Target
      desc Improved operating model
      icon mdi/bullseye-arrow
      children
        - label Guided
          desc Clear steps keep decisions moving
          icon mdi/sign-direction
        - label Connected
          desc Shared context reduces rework
          icon mdi/source-branch`;
}

function createHierarchyData(title: string): string {
  return `data
  title ${title}
  desc A simple operating model for team execution
  root
    label Growth System
    desc Coordinated work from insight to impact
    children
      - label Strategy
        desc Define the highest-value direction
        value 34
        icon mdi/chess-queen
      - label Planning
        desc Turn direction into sequenced work
        value 52
        icon mdi/calendar-check
      - label Delivery
        desc Build and ship reliable outcomes
        value 74
        icon mdi/package-variant-closed
      - label Learning
        desc Feed results back into the next cycle
        value 91
        icon mdi/chart-line`;
}

function createRelationData(title: string): string {
  return `data
  title ${title}
  desc Connected decisions across a delivery system
  nodes
    - id insight
      label Insight
      desc Signals from users and the market
      icon mdi/lightbulb-on
    - id plan
      label Plan
      desc Prioritized scope and ownership
      icon mdi/clipboard-list
    - id execute
      label Execute
      desc Coordinated implementation work
      icon mdi/cogs
    - id measure
      label Measure
      desc Results that guide the next move
      icon mdi/chart-timeline-variant
  relations
    - insight -> plan
    - plan -> execute
    - execute -> measure
    - measure -> insight`;
}

function createWordCloudData(title: string): string {
  return `data
  title ${title}
  desc Core themes for a product strategy discussion
  items
    - label Research
      value 96
    - label Focus
      value 88
    - label Quality
      value 82
    - label Launch
      value 74
    - label Growth
      value 68
    - label Trust
      value 62
    - label Clarity
      value 54
    - label Feedback
      value 48`;
}

function createSyntax(templateId: string, categoryKey: string): string {
  const title = titleCaseTemplate(templateId);
  const data =
    categoryKey === "compare"
      ? createCompareData(title)
      : categoryKey === "hierarchy"
        ? createHierarchyData(title)
        : categoryKey === "relation"
          ? createRelationData(title)
          : categoryKey === "wordcloud"
            ? createWordCloudData(title)
            : createItemsData(title);

  return `infographic ${templateId}
${DEFAULT_THEME}
${data}`;
}

export const diagramCategories: DiagramCategory[] = INFOGRAPHIC_CATEGORIES.map(
  (category) => ({
    key: category.key,
    name: category.name,
    items: category.templates.map((templateId) => {
      const syntax = createSyntax(templateId, category.key);
      return {
        key: templateId,
        label: titleCaseTemplate(templateId),
        categoryKey: category.key,
        categoryName: category.name,
        templateId,
        syntax,
        node: createInfographicNode(syntax),
      };
    }),
  }),
);
