"use server";

import "server-only";

import { logger } from "@/lib/observability/server/logger";
import { DocumentType, Prisma } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const ITEMS_PER_PAGE = 10;
const PRESENTATION_DOCUMENT_TYPES = [DocumentType.PRESENTATION] as const;
export type PresentationDocumentTypeFilter =
  (typeof PRESENTATION_DOCUMENT_TYPES)[number];

export async function fetchPresentations(
  page = 0,
  type?: PresentationDocumentTypeFilter,
) {
  const actionName = "presentation.fetchPresentations.fetchPresentations";
  const span = logger.startSpan(`notebook.server_action.${actionName}`, {
    attributes: {
      "allweone.scope": "notebook",
      "allweone.action.type": "server_action",
      "allweone.action.name": actionName,
    },
  });

  try {
    const session = await auth();
    const userId = session?.user.id;

    if (!userId) {
      return {
        items: [],
        hasMore: false,
      };
    }

    const skip = page * ITEMS_PER_PAGE;
    const documentTypeFilter = type
      ? Prisma.sql`AND d."type" = ${type}`
      : Prisma.sql`AND d."type" = ${PRESENTATION_DOCUMENT_TYPES[0]}`;

    type PresentationListRow = {
      id: string;
      title: string;
      type: DocumentType;
      thumbnailUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      isOwnedByCurrentUser: boolean;
      favoriteId: string | null;
      hasSlides: boolean;
      hasContent: boolean;
    };

    const rows = await db.$queryRaw<PresentationListRow[]>(Prisma.sql`
      SELECT
        d."id",
        d."title",
        d."type",
        d."thumbnailUrl",
        d."createdAt",
        d."updatedAt",
        d."userId" = ${userId} AS "isOwnedByCurrentUser",
        fav."id" AS "favoriteId",
        CASE
          WHEN d."type" = ${DocumentType.PRESENTATION} AND p."id" IS NOT NULL
            THEN CASE
              WHEN jsonb_typeof(p."content"->'slides') = 'array'
                AND jsonb_array_length(p."content"->'slides') > 0
                THEN true
              WHEN jsonb_typeof(p."aiGeneratedContent"->'slides') = 'array'
                AND jsonb_array_length(p."aiGeneratedContent"->'slides') > 0
                THEN true
              WHEN NULLIF(BTRIM(p."aiGeneratedContent"->>'slidesXml'), '') IS NOT NULL
                THEN true
              ELSE false
            END
          ELSE false
        END AS "hasSlides",
        CASE
          WHEN d."type" = ${DocumentType.PRESENTATION} AND p."id" IS NOT NULL
            THEN CASE
              WHEN jsonb_typeof(p."content"->'slides') = 'array'
                AND jsonb_array_length(p."content"->'slides') > 0
                THEN true
              WHEN jsonb_typeof(p."aiGeneratedContent"->'slides') = 'array'
                AND jsonb_array_length(p."aiGeneratedContent"->'slides') > 0
                THEN true
              WHEN NULLIF(BTRIM(p."aiGeneratedContent"->>'slidesXml'), '') IS NOT NULL
                THEN true
              ELSE false
            END
          ELSE false
        END AS "hasContent"
      FROM "BaseDocument" d
      LEFT JOIN "Presentation" p
        ON p."id" = d."id"
      LEFT JOIN LATERAL (
        SELECT f."id"
        FROM "FavoriteDocument" f
        WHERE
          f."documentId" = d."id"
          AND f."userId" = ${userId}
        LIMIT 1
      ) fav
        ON true
      WHERE
        (
          d."userId" = ${userId}
          OR EXISTS (
            SELECT 1
            FROM "DocumentPrivateShare" share
            WHERE
              share."baseDocumentId" = d."id"
              AND share."recipientUserId" = ${userId}
          )
        )
        ${documentTypeFilter}
      ORDER BY d."updatedAt" DESC
      LIMIT ${ITEMS_PER_PAGE + 1}
      OFFSET ${skip}
    `);

    const hasMore = rows.length > ITEMS_PER_PAGE;
    const items = hasMore ? rows.slice(0, ITEMS_PER_PAGE) : rows;

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isOwnedByCurrentUser: item.isOwnedByCurrentUser,
        favorites: item.favoriteId ? [{ id: item.favoriteId }] : [],
        hasSlides: item.hasSlides,
        hasContent: item.hasContent,
      })),
      hasMore,
    };
  } catch (error) {
    span.error(error);
    throw error;
  } finally {
    span.end();
  }
}
