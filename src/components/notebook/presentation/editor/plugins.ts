"use client";

// Create presentation-specific plugins
import { ExitBreakPlugin, KEYS } from "platejs";
import { BlockPlaceholderPlugin } from "platejs/react";

import { AIKit } from "@/components/plate/plugins/ai-kit";
import { AlignKit } from "@/components/plate/plugins/align-kit";
import { BasicMarksKit } from "@/components/plate/plugins/basic-marks-kit";
import { BlockMenuKit } from "@/components/plate/plugins/block-menu-kit";
import { CalloutKit } from "@/components/plate/plugins/callout-kit";
import { CodeBlockKit } from "@/components/plate/plugins/code-block-kit";
import { CommentKit } from "@/components/plate/plugins/comment-kit";
import { CursorOverlayKit } from "@/components/plate/plugins/cursor-overlay-kit";
import { DateKit } from "@/components/plate/plugins/date-kit";
import { DiscussionKit } from "@/components/plate/plugins/discussion-kit";
import { DndKit } from "@/components/plate/plugins/dnd-kit";
import { DocxKit } from "@/components/plate/plugins/docx-kit";
import { EmojiKit } from "@/components/plate/plugins/emoji-kit";
import { FixedToolbarKit } from "@/components/plate/plugins/fixed-toolbar-kit";
import { FloatingToolbarKit } from "@/components/plate/plugins/floating-toolbar-kit";
import { FontKit } from "@/components/plate/plugins/font-kit";
import { LayoutFloatingToolbarKit } from "@/components/plate/plugins/layout-floating-toolbar-kit";
import { LineHeightKit } from "@/components/plate/plugins/line-height-kit";
import { LinkKit } from "@/components/plate/plugins/link-kit";
import { ListKit } from "@/components/plate/plugins/list-kit";
import { MarkdownKit } from "@/components/plate/plugins/markdown-kit";
import { MathKit } from "@/components/plate/plugins/math-kit";
import { MentionKit } from "@/components/plate/plugins/mention-kit";
import { SlashKit } from "@/components/plate/plugins/slash-kit";
import { SuggestionKit } from "@/components/plate/plugins/suggestion-kit";
import { TocKit } from "@/components/plate/plugins/toc-kit";
import { ToggleKit } from "@/components/plate/plugins/toggle-kit";
import { AntvInfographicPlugin } from "./plugins/antv-infographic-plugin";
import { ArrowListItemPlugin, ArrowListPlugin } from "./plugins/arrow-plugin";
import { BasicBlocksKit } from "./plugins/basic-blocks-kit";
import {
  BeforeAfterGroupPlugin,
  BeforeAfterSidePlugin,
} from "./plugins/before-after-plugin";
import { BoxGroupPlugin, BoxItemPlugin } from "./plugins/box-plugin";
import { BulletGroupPlugin, BulletItemPlugin } from "./plugins/bullet-plugin";
import { ButtonPlugin } from "./plugins/button-plugin";
import {
  AreaChartPlugin,
  BarChartPlugin,
  BoxPlotChartPlugin,
  BubbleChartPlugin,
  CandlestickChartPlugin,
  ChordChartPlugin,
  ComposedChartPlugin,
  ConeFunnelChartPlugin,
  DonutChartPlugin,
  FunnelChartPlugin,
  HeatmapChartPlugin,
  HistogramChartPlugin,
  LinearGaugePlugin,
  LineChartPlugin,
  NightingaleChartPlugin,
  OhlcChartPlugin,
  PieChartPlugin,
  PyramidChartPlugin,
  RadarChartPlugin,
  RadialBarChartPlugin,
  RadialColumnChartPlugin,
  RadialGaugePlugin,
  RangeAreaChartPlugin,
  RangeBarChartPlugin,
  SankeyChartPlugin,
  ScatterChartPlugin,
  SunburstChartPlugin,
  TreemapChartPlugin,
  WaterfallChartPlugin,
} from "./plugins/chart-plugin";
import {
  CompareGroupPlugin,
  CompareSidePlugin,
} from "./plugins/compare-plugin";
import { CustomItemBreakPlugin } from "./plugins/custom-item-break-plugin";
import { CycleItemPlugin, CyclePlugin } from "./plugins/cycle-plugin";
import {
  CircularGridGroupPlugin,
  CircularGridItemPlugin,
  ConnectedCirclesGroupPlugin,
  ConnectedCirclesItemPlugin,
  SlopeGroupPlugin,
  SlopeItemPlugin,
  SnakeGroupPlugin,
  SnakeItemPlugin,
} from "./plugins/diagram-components-plugin";
import { EmptyBlockPlugin } from "./plugins/empty-block";
import { FlexBoxPlugin } from "./plugins/flex-box-plugin";
import { FocusedParagraphPlaceholderPlugin } from "./plugins/focused-paragraph-placeholder-plugin-config";
import { GeneratingPlugin } from "./plugins/generating-plugin";
import { IconListItemPlugin, IconListPlugin } from "./plugins/icon-list-plugin";
import { IconPlugin } from "./plugins/icon-plugin";
import {
  VisualizationItemPlugin,
  VisualizationListPlugin,
} from "./plugins/legacy/visualization-list-plugin";
import { MediaKit } from "./plugins/media-kit";
import { PresentationAutoformatKit } from "./plugins/presentation-autoformat-kit";
import { PresentationColumnKit } from "./plugins/presentation-column-kit";
import { PresentationTableKit } from "./plugins/presentation-table-kit";
import {
  ConsItemPlugin,
  ProsConsGroupPlugin,
  ProsItemPlugin,
} from "./plugins/pros-cons-plugin";
import {
  PyramidGroupPlugin,
  PyramidItemPlugin,
} from "./plugins/pyramid-plugin";
import { QuotePlugin } from "./plugins/quote-plugin";
import {
  SequenceArrowGroupPlugin,
  SequenceArrowItemPlugin,
} from "./plugins/sequence-arrow-plugin";
import { CustomPlaceholderPlugin } from "./plugins/slide-placeholder-plugin";
import {
  StaircaseGroupPlugin,
  StairItemPlugin,
} from "./plugins/staircase-plugin";
import { StatsGroupPlugin, StatsItemPlugin } from "./plugins/stats-plugin";
import { StepsItemPlugin, StepsPlugin } from "./plugins/steps-plugin";
import { TimelineItemPlugin, TimelinePlugin } from "./plugins/timeline-plugin";

// import { TablePlugin, TableRowPlugin, TableCellPlugin } from "./plugins/table-plugin";

const PresentationBlockPlaceholderKit = [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        "before:absolute before:cursor-text before:opacity-30 before:content-[attr(placeholder)]",
      placeholders: {
        [KEYS.h1]: "Untitled Card",
        [KEYS.h2]: "Untitled Card",
        [KEYS.h3]: "Untitled Card",
        [KEYS.h4]: "Untitled Card",
        [KEYS.h5]: "Untitled Card",
        [KEYS.h6]: "Untitled Card",
      },
      query: ({ path }) => {
        return path.length === 1;
      },
    },
  }),
];

export const presentationPlugins = [
  ...AIKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  // Replace default table with themed presentation table
  ...PresentationTableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...PresentationColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...PresentationAutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ExitBreakPlugin.configure({
    shortcuts: {
      insert: { keys: "mod+enter" },
    },
  }),
  CustomItemBreakPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  FocusedParagraphPlaceholderPlugin,
  CustomPlaceholderPlugin,
  ...PresentationBlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
  ...LayoutFloatingToolbarKit,
  EmptyBlockPlugin,

  // Custom ELements
  VisualizationListPlugin,
  VisualizationItemPlugin,

  BulletGroupPlugin,
  BulletItemPlugin,

  StaircaseGroupPlugin,
  StairItemPlugin,

  IconPlugin,
  IconListPlugin,
  IconListItemPlugin,

  ArrowListPlugin,
  ArrowListItemPlugin,

  TimelinePlugin,
  TimelineItemPlugin,
  StepsPlugin,
  StepsItemPlugin,

  PyramidGroupPlugin,
  PyramidItemPlugin,

  // New components
  BoxGroupPlugin,
  BoxItemPlugin,

  // ColumnGroupPlugin,
  // ColumnItemPlugin,

  CompareGroupPlugin,
  CompareSidePlugin,

  BeforeAfterGroupPlugin,
  BeforeAfterSidePlugin,

  ProsConsGroupPlugin,
  ProsItemPlugin,
  ConsItemPlugin,

  SequenceArrowGroupPlugin,
  SequenceArrowItemPlugin,

  SlopeGroupPlugin,
  SlopeItemPlugin,
  ConnectedCirclesGroupPlugin,
  ConnectedCirclesItemPlugin,
  CircularGridGroupPlugin,
  CircularGridItemPlugin,
  SnakeGroupPlugin,
  SnakeItemPlugin,

  // Stats components
  StatsGroupPlugin,
  StatsItemPlugin,

  // Individual chart elements
  PieChartPlugin,
  BarChartPlugin,
  AreaChartPlugin,
  RadarChartPlugin,
  ScatterChartPlugin,
  BubbleChartPlugin,
  LineChartPlugin,
  ComposedChartPlugin,
  RadialBarChartPlugin,
  TreemapChartPlugin,
  DonutChartPlugin,
  // New chart plugins
  HistogramChartPlugin,
  HeatmapChartPlugin,
  RangeBarChartPlugin,
  RangeAreaChartPlugin,
  WaterfallChartPlugin,
  BoxPlotChartPlugin,
  CandlestickChartPlugin,
  OhlcChartPlugin,
  NightingaleChartPlugin,
  RadialColumnChartPlugin,
  SunburstChartPlugin,
  SankeyChartPlugin,
  ChordChartPlugin,
  FunnelChartPlugin,
  ConeFunnelChartPlugin,
  PyramidChartPlugin,
  RadialGaugePlugin,
  LinearGaugePlugin,

  CycleItemPlugin,
  CyclePlugin,

  GeneratingPlugin,
  ButtonPlugin,
  FlexBoxPlugin,
  QuotePlugin,

  // AntV Infographic
  AntvInfographicPlugin,
];
