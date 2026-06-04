// @ts-nocheck
"use server";

import { type InputJsonValue } from "@prisma/client/runtime/client";

import { extractDocumentContentByType } from "@/lib/document-content/contentSchemas";
import { logger } from "@/lib/observability/server/logger";
import { isBuiltInPresentationTheme } from "@/lib/presentation/theme-resolution";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Fetch all presentation templates
 */
export async function fetchPresentationTemplates() {
  const actionName =
    "presentation.presentationTemplateActions.fetchPresentationTemplates";
  const span = logger.startSpan(`notebook.server_action.${actionName}`, {
    attributes: {
      "allweone.scope": "notebook",
      "allweone.action.type": "server_action",
      "allweone.action.name": actionName,
    },
  });

  try {
    const session = await auth();
    const userId = session?.user?.id;

    try {
      const templates = await db.template.findMany({
        where: {
          type: "PRESENTATION",
          isDeleted: false,
          OR: [{ isPublic: true }, ...(userId ? [{ userId }] : [])],
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return {
        success: true,
        templates,
      };
    } catch (error) {
      console.error("Error fetching presentation templates:", error);
      return {
        success: false,
        message: "Failed to fetch presentation templates",
      };
    }
  } catch (error) {
    span.error(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Clone a presentation template
 */
export async function clonePresentationTemplate(templateId: string) {
  const actionName =
    "presentation.presentationTemplateActions.clonePresentationTemplate";
  const span = logger.startSpan(`notebook.server_action.${actionName}`, {
    attributes: {
      "allweone.scope": "notebook",
      "allweone.action.type": "server_action",
      "allweone.action.name": actionName,
    },
  });

  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    try {
      // Fetch the template
      const template = await db.template.findFirst({
        where: {
          id: templateId,
          type: "PRESENTATION",
          isDeleted: false,
          OR: [{ isPublic: true }, { userId: session.user.id }],
        },
      });

      if (!template) {
        return {
          success: false,
          message: "Template not found",
        };
      }

      const content = extractDocumentContentByType(
        template.type,
        template.content,
      ) as InputJsonValue;

      const templateContentObj = template.content as Record<
        string,
        unknown
      > | null;
      const themeFromTemplate = templateContentObj?.theme as string | undefined;
      const customizationFromTemplate =
        (templateContentObj?.customization as Record<string, unknown>) ?? {};

      let finalTheme = themeFromTemplate || "mystique";
      const finalCustomization = { ...customizationFromTemplate };
      let isAdminTheme = false;
      let themeDataToEmbed: unknown = null;

      if (
        finalTheme &&
        finalTheme !== "auto" &&
        !isBuiltInPresentationTheme(finalTheme)
      ) {
        const themeRecord = await db.presentationTheme.findUnique({
          where: { id: finalTheme },
        });
        if (themeRecord) {
          if (themeRecord.isAdmin) {
            isAdminTheme = true;
          } else {
            themeDataToEmbed = themeRecord.themeData;
          }
        } else {
          isAdminTheme = true;
          finalTheme = "mystique";
        }
      } else if (isBuiltInPresentationTheme(finalTheme)) {
        isAdminTheme = true;
      }

      if (isAdminTheme) {
        delete finalCustomization.themeData;
        delete finalCustomization.generatedThemeData;
      } else if (themeDataToEmbed) {
        finalCustomization.themeData = themeDataToEmbed;
        finalTheme = "auto";
      }

      // Create a new presentation from the template
      const newPresentation = await db.baseDocument.create({
        data: {
          type: "PRESENTATION",
          documentType: "presentation",
          title: template.title,
          userId: session.user.id,
          thumbnailUrl: template.thumbnailUrl,
          presentation: {
            create: {
              content,
              theme: finalTheme,
              customization:
                Object.keys(finalCustomization).length > 0
                  ? (finalCustomization as InputJsonValue)
                  : undefined,
              templateId: templateId,
              // Copy other relevant fields if needed
              language: "en-US",
            },
          },
        },
        include: {
          presentation: {
            select: {
              id: true,
              content: true,
              theme: true,
            },
          },
        },
      });

      return {
        success: true,
        message: "Template cloned successfully",
        presentation: {
          id: newPresentation.id,
          title: newPresentation.title,
          presentation: newPresentation.presentation,
        },
      };
    } catch (error) {
      console.error("Error cloning presentation template:", error);
      return {
        success: false,
        message: "Failed to clone template",
      };
    }
  } catch (error) {
    span.error(error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a presentation template from an existing presentation
 */

/**
 * Delete a presentation template (Admin only)
 */
export async function deletePresentationTemplate(templateId: string) {
  const actionName =
    "presentation.presentationTemplateActions.deletePresentationTemplate";

  const span = logger.startSpan(`notebook.server_action.${actionName}`, {
    attributes: {
      "allweone.scope": "notebook",
      "allweone.action.type": "server_action",
      "allweone.action.name": actionName,
    },
  });

  try {
    const session = await auth();

    // Verify user is an admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    // Mark the template as deleted
    await db.template.update({
      where: {
        id: templateId,
      },
      data: {
        isDeleted: true,
      },
    });

    return {
      success: true,
      message: "Template deleted successfully",
    };
  } catch (error) {
    span.error(error as Error);
    console.error("Error deleting presentation template:", error);
    return {
      success: false,
      message: "Failed to delete template",
    };
  } finally {
    span.end();
  }
}
