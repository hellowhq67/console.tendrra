import { tool } from "ai";
import { z } from "zod";
import { search } from "../lib/parallel.js";

export const webSearchTool = tool({
  description: "Search the web for information",
  inputSchema: z.object({
    objective: z.string().describe("The primary objective of the search"),
    queries: z.array(z.string()).describe("List of search queries"),
  }),
  execute: async ({ objective, queries }) => {
    return await search(objective, queries);
  },
});
