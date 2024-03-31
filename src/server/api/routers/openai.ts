/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { makeLouisRequest } from "../controllers/louis";
import { Category, Model } from "~/shared/Constants";
import { db } from "~/server/db";

export const openAiRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        content: z.string().nullable(),
        role: z.enum(["user", "system"]),
      })),
      model: z.nativeEnum(Model),

      selectedCategory: z.nativeEnum(Category),
    }))
    .mutation(async ({ input }) => {
      const question = input.messages[input?.messages?.length - 1]?.content ?? ""
      const louisResponse = await makeLouisRequest(question, input.selectedCategory, input.model)
      const louisMessage = louisResponse?.body.responseContent
      // const louisMessage = input.selectedCategory
      return {
        message: louisMessage,
        role: "system"
      };
    }),

  // Here's the addition of saveToFavorites within the same router
  saveToFavorites: protectedProcedure
    .input(z.object({
      content: z.string(),
      userInput: z.string(), // The user's original input
      role: z.enum(["user", "system"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Assuming you have session/user authentication set up to provide ctx.user.id
      if (!ctx.user?.id) {
        throw new Error("User ID not found in session");
      }
      const { content, userInput, role } = input;
      const userId = ctx.user.id; // Use the authenticated user's ID from the context
      const savedFavorite = await db.favorite.create({
        data: {
          content,
          userInput,
          role,
          userId, // Associate the favorite with the logged-in user
        },
      });

      return savedFavorite;
    }),

  
});
