import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin,
} from "@platejs/table";
import { KEYS } from "platejs";
import { createTPlatePlugin } from "platejs/react";

import VisualizationItemElementStatic from "../custom-elements/legacy/visualization-item-static";
import VisualizationListElementStatic from "../custom-elements/legacy/visualization-list-static";
import AntvInfographicStatic from "../custom-elements/static/antv-infographic-static";
import { ArrowItemStatic } from "../custom-elements/static/arrow-item-static";
import ArrowListStatic from "../custom-elements/static/arrow-list-static";
import { BeforeAfterSideStatic } from "../custom-elements/static/before-after-side-static";
import BeforeAfterGroupStatic from "../custom-elements/static/before-after-static";
import { BoxItemStatic } from "../custom-elements/static/box-item-static";
import BoxGroupStatic from "../custom-elements/static/box-static";
import { BulletItemStatic } from "../custom-elements/static/bullet-item-static";
import { BulletsElementStatic } from "../custom-elements/static/bullet-static";
import ButtonStatic from "../custom-elements/static/button-static";
import { CircularGridItemStatic } from "../custom-elements/static/circular-grid-item-static";
import CircularGridStatic from "../custom-elements/static/circular-grid-static";
import { CompareSideStatic } from "../custom-elements/static/compare-side-static";
import CompareGroupStatic from "../custom-elements/static/compare-static";
import { ConnectedCircleItemStatic } from "../custom-elements/static/connected-circle-item-static";
import ConnectedCirclesStatic from "../custom-elements/static/connected-circles-static";
import { ConsItemStatic } from "../custom-elements/static/cons-item-static";
import { ContributorStatic } from "../custom-elements/static/contributor-static";
import { CycleElementStatic } from "../custom-elements/static/cycle-element-static";
import { CycleItemStatic } from "../custom-elements/static/cycle-item-static";
import FlexBoxStatic from "../custom-elements/static/flex-box-static";
import { GeneratingLeafStatic } from "../custom-elements/static/generating-leaf-static";
import { IconListItemStatic } from "../custom-elements/static/icon-list-item-static";
import { IconListStatic } from "../custom-elements/static/icon-list-static";
import { IconStatic } from "../custom-elements/static/icon-static";
import { LabelStatic } from "../custom-elements/static/label-static";
import { MediaEmbedElementStatic } from "../custom-elements/static/media-embed-element-static";
import { PresentationImageElementStatic } from "../custom-elements/static/presentation-image-element-static";
import {
  PresentationTableCellElementStatic,
  PresentationTableCellHeaderElementStatic,
  PresentationTableElementStatic,
  PresentationTableRowElementStatic,
} from "../custom-elements/static/presentation-table-static";
import { PresentationTitleStatic } from "../custom-elements/static/presentation-title-static";
import ProsConsGroupStatic from "../custom-elements/static/pros-cons-static";
import { ProsItemStatic } from "../custom-elements/static/pros-item-static";
import { PyramidItemStatic } from "../custom-elements/static/pyramid-item-static";
import PyramidStatic from "../custom-elements/static/pyramid-static";
import { QuoteStatic } from "../custom-elements/static/quote-static";
import { SequenceArrowItemStatic } from "../custom-elements/static/sequence-arrow-item-static";
import SequenceArrowStatic from "../custom-elements/static/sequence-arrow-static";
import { SlopeItemStatic } from "../custom-elements/static/slope-item-static";
import SlopeStatic from "../custom-elements/static/slope-static";
import { SnakeItemStatic } from "../custom-elements/static/snake-item-static";
import SnakeStatic from "../custom-elements/static/snake-static";
import { StairItemStatic } from "../custom-elements/static/staircase-item-static";
import StaircaseStatic from "../custom-elements/static/staircase-static";
import { StatsItemStatic } from "../custom-elements/static/stats-item-static";
import StatsGroupStatic from "../custom-elements/static/stats-static";
import StepsElementStatic from "../custom-elements/static/steps-element-static";
import { StepsItemStatic } from "../custom-elements/static/steps-item-static";
import { TimelineItemStatic } from "../custom-elements/static/timeline-item-static";
import TimelineStatic from "../custom-elements/static/timeline-static";
import {
  ANTV_INFOGRAPHIC,
  ARROW_LIST,
  ARROW_LIST_ITEM,
  BEFORE_AFTER_GROUP,
  BEFORE_AFTER_SIDE,
  BOX_GROUP,
  BOX_ITEM,
  BULLET_GROUP,
  BULLET_ITEM,
  BUTTON_ELEMENT,
  CIRCULAR_GRID_GROUP,
  CIRCULAR_GRID_ITEM,
  COMPARE_GROUP,
  COMPARE_SIDE,
  CONNECTED_CIRCLES_GROUP,
  CONNECTED_CIRCLES_ITEM,
  CONS_ITEM,
  CONTRIBUTOR_ELEMENT,
  CYCLE_GROUP,
  CYCLE_ITEM,
  FLEX_BOX,
  ICON_ELEMENT,
  ICON_LIST,
  ICON_LIST_ITEM,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
  PROS_CONS_GROUP,
  PROS_ITEM,
  PYRAMID_GROUP,
  PYRAMID_ITEM,
  QUOTE_ELEMENT,
  SEQUENCE_ARROW_GROUP,
  SEQUENCE_ARROW_ITEM,
  SLOPE_GROUP,
  SLOPE_ITEM,
  SNAKE_GROUP,
  SNAKE_ITEM,
  STAIR_ITEM,
  STAIRCASE_GROUP,
  STATS_GROUP,
  STATS_ITEM,
  STEPS_GROUP,
  STEPS_ITEM,
  TIMELINE_GROUP,
  TIMELINE_ITEM,
} from "../lib";
import {
  AreaChartStaticPlugin,
  BarChartStaticPlugin,
  BoxPlotChartStaticPlugin,
  BubbleChartStaticPlugin,
  CandlestickChartStaticPlugin,
  ChordChartStaticPlugin,
  ComposedChartStaticPlugin,
  ConeFunnelChartStaticPlugin,
  DonutChartStaticPlugin,
  FunnelChartStaticPlugin,
  HeatmapChartStaticPlugin,
  HistogramChartStaticPlugin,
  LinearGaugeStaticPlugin,
  LineChartStaticPlugin,
  NightingaleChartStaticPlugin,
  OhlcChartStaticPlugin,
  PieChartStaticPlugin,
  PyramidChartStaticPlugin,
  RadarChartStaticPlugin,
  RadialBarChartStaticPlugin,
  RadialColumnChartStaticPlugin,
  RadialGaugeStaticPlugin,
  RangeAreaChartStaticPlugin,
  RangeBarChartStaticPlugin,
  SankeyChartStaticPlugin,
  ScatterChartStaticPlugin,
  SunburstChartStaticPlugin,
  TreemapChartStaticPlugin,
  WaterfallChartStaticPlugin,
} from "./chart-plugin";

export const PresentationStaticCustomKit = [
  // Image
  createTPlatePlugin({
    key: KEYS.img,
    node: { isElement: true, component: PresentationImageElementStatic },
  }),
  // Media Embed
  createTPlatePlugin({
    key: KEYS.mediaEmbed,
    node: { isElement: true, component: MediaEmbedElementStatic },
  }),
  createTPlatePlugin({
    key: ARROW_LIST,
    node: { isElement: true, component: ArrowListStatic },
  }),
  createTPlatePlugin({
    key: ARROW_LIST_ITEM,
    node: { isElement: true, component: ArrowItemStatic },
  }),
  createTPlatePlugin({
    key: BULLET_GROUP,
    node: { isElement: true, component: BulletsElementStatic },
  }),
  createTPlatePlugin({
    key: BULLET_ITEM,
    node: { isElement: true, component: BulletItemStatic },
  }),
  createTPlatePlugin({
    key: STAIRCASE_GROUP,
    node: { isElement: true, component: StaircaseStatic },
  }),
  createTPlatePlugin({
    key: STAIR_ITEM,
    node: { isElement: true, component: StairItemStatic },
  }),
  createTPlatePlugin({
    key: CYCLE_GROUP,
    node: { isElement: true, component: CycleElementStatic },
  }),
  createTPlatePlugin({
    key: CYCLE_ITEM,
    node: { isElement: true, component: CycleItemStatic },
  }),
  createTPlatePlugin({
    key: SLOPE_GROUP,
    node: { isElement: true, component: SlopeStatic },
  }),
  createTPlatePlugin({
    key: SLOPE_ITEM,
    node: { isElement: true, component: SlopeItemStatic },
  }),
  createTPlatePlugin({
    key: CONNECTED_CIRCLES_GROUP,
    node: { isElement: true, component: ConnectedCirclesStatic },
  }),
  createTPlatePlugin({
    key: CONNECTED_CIRCLES_ITEM,
    node: { isElement: true, component: ConnectedCircleItemStatic },
  }),
  createTPlatePlugin({
    key: CIRCULAR_GRID_GROUP,
    node: { isElement: true, component: CircularGridStatic },
  }),
  createTPlatePlugin({
    key: CIRCULAR_GRID_ITEM,
    node: { isElement: true, component: CircularGridItemStatic },
  }),
  createTPlatePlugin({
    key: SNAKE_GROUP,
    node: { isElement: true, component: SnakeStatic },
  }),
  createTPlatePlugin({
    key: SNAKE_ITEM,
    node: { isElement: true, component: SnakeItemStatic },
  }),
  createTPlatePlugin({
    key: ICON_ELEMENT,
    node: { isElement: true, component: IconStatic },
  }),
  createTPlatePlugin({
    key: ICON_LIST,
    node: { isElement: true, component: IconListStatic },
  }),
  createTPlatePlugin({
    key: ICON_LIST_ITEM,
    node: { isElement: true, component: IconListItemStatic },
  }),
  createTPlatePlugin({
    key: PYRAMID_GROUP,
    node: { isElement: true, component: PyramidStatic },
  }),
  createTPlatePlugin({
    key: PYRAMID_ITEM,
    node: { isElement: true, component: PyramidItemStatic },
  }),
  createTPlatePlugin({
    key: TIMELINE_GROUP,
    node: { isElement: true, component: TimelineStatic },
  }),
  createTPlatePlugin({
    key: TIMELINE_ITEM,
    node: { isElement: true, component: TimelineItemStatic },
  }),
  createTPlatePlugin({
    key: STEPS_GROUP,
    node: { isElement: true, component: StepsElementStatic },
  }),
  createTPlatePlugin({
    key: STEPS_ITEM,
    node: { isElement: true, component: StepsItemStatic },
  }),
  // Box
  createTPlatePlugin({
    key: BOX_GROUP,
    node: { isElement: true, component: BoxGroupStatic },
  }),
  createTPlatePlugin({
    key: BOX_ITEM,
    node: { isElement: true, component: BoxItemStatic },
  }),
  // Compare
  createTPlatePlugin({
    key: COMPARE_GROUP,
    node: { isElement: true, component: CompareGroupStatic },
  }),
  createTPlatePlugin({
    key: COMPARE_SIDE,
    node: { isElement: true, component: CompareSideStatic },
  }),
  // Before/After
  createTPlatePlugin({
    key: BEFORE_AFTER_GROUP,
    node: { isElement: true, component: BeforeAfterGroupStatic },
  }),
  createTPlatePlugin({
    key: BEFORE_AFTER_SIDE,
    node: { isElement: true, component: BeforeAfterSideStatic },
  }),
  // Pros & Cons
  createTPlatePlugin({
    key: PROS_CONS_GROUP,
    node: { isElement: true, component: ProsConsGroupStatic },
  }),
  createTPlatePlugin({
    key: PROS_ITEM,
    node: { isElement: true, component: ProsItemStatic },
  }),
  createTPlatePlugin({
    key: CONS_ITEM,
    node: { isElement: true, component: ConsItemStatic },
  }),
  // Arrow Vertical
  createTPlatePlugin({
    key: SEQUENCE_ARROW_GROUP,
    node: { isElement: true, component: SequenceArrowStatic },
  }),
  createTPlatePlugin({
    key: SEQUENCE_ARROW_ITEM,
    node: { isElement: true, component: SequenceArrowItemStatic },
  }),
  // Stats
  createTPlatePlugin({
    key: STATS_GROUP,
    node: { isElement: true, component: StatsGroupStatic },
  }),
  createTPlatePlugin({
    key: STATS_ITEM,
    node: { isElement: true, component: StatsItemStatic },
  }),
  // Button
  createTPlatePlugin({
    key: BUTTON_ELEMENT,
    node: { isElement: true, component: ButtonStatic },
  }),
  createTPlatePlugin({
    key: PRESENTATION_TITLE_ELEMENT,
    node: { isElement: true, component: PresentationTitleStatic },
  }),
  createTPlatePlugin({
    key: LABEL_ELEMENT,
    node: { isElement: true, component: LabelStatic },
  }),
  createTPlatePlugin({
    key: CONTRIBUTOR_ELEMENT,
    node: { isElement: true, component: ContributorStatic },
  }),
  // FlexBox
  createTPlatePlugin({
    key: FLEX_BOX,
    node: { isElement: true, component: FlexBoxStatic },
  }),
  // Legacy adapters
  createTPlatePlugin({
    key: "visualization-list",
    node: { isElement: true, component: VisualizationListElementStatic },
  }),
  createTPlatePlugin({
    key: "visualization-item",
    node: { isElement: true, component: VisualizationItemElementStatic },
  }),

  BaseTablePlugin.withComponent(PresentationTableElementStatic),
  BaseTableRowPlugin.withComponent(PresentationTableRowElementStatic),
  BaseTableCellPlugin.withComponent(PresentationTableCellElementStatic),
  BaseTableCellHeaderPlugin.withComponent(
    PresentationTableCellHeaderElementStatic,
  ),

  // Removed generic chart element router per request
  // Individual static chart elements
  PieChartStaticPlugin,
  BarChartStaticPlugin,
  AreaChartStaticPlugin,
  RadarChartStaticPlugin,
  ScatterChartStaticPlugin,
  BubbleChartStaticPlugin,
  LineChartStaticPlugin,
  RadialBarChartStaticPlugin,
  ComposedChartStaticPlugin,
  TreemapChartStaticPlugin,
  DonutChartStaticPlugin,
  // New static chart plugins
  HistogramChartStaticPlugin,
  HeatmapChartStaticPlugin,
  RangeBarChartStaticPlugin,
  RangeAreaChartStaticPlugin,
  WaterfallChartStaticPlugin,
  BoxPlotChartStaticPlugin,
  CandlestickChartStaticPlugin,
  OhlcChartStaticPlugin,
  NightingaleChartStaticPlugin,
  RadialColumnChartStaticPlugin,
  SunburstChartStaticPlugin,
  SankeyChartStaticPlugin,
  ChordChartStaticPlugin,
  FunnelChartStaticPlugin,
  ConeFunnelChartStaticPlugin,
  PyramidChartStaticPlugin,
  RadialGaugeStaticPlugin,
  LinearGaugeStaticPlugin,
  // Quote
  createTPlatePlugin({
    key: QUOTE_ELEMENT,
    node: { isElement: true, component: QuoteStatic },
  }),
  // Leaf for generating caret in static mode
  createTPlatePlugin({
    key: "generating",
    node: { isLeaf: true, component: GeneratingLeafStatic },
  }),
  // AntV Infographic
  createTPlatePlugin({
    key: ANTV_INFOGRAPHIC,
    node: { isElement: true, isVoid: true, component: AntvInfographicStatic },
  }),
];
