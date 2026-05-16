import { tool } from "ai";
import { z } from "zod";
import { Daytona } from "@daytonaio/sdk";

// Initialize Daytona client
const daytona = new Daytona({
  apiKey: process.env.DAYTONA_API_KEY || "",
});

export const sandboxTool = tool({
  description: "Execute code or shell commands in a secure Daytona sandbox. Use this for complex logic, data processing, or building software artifacts. The environment is isolated and powerful.",
  inputSchema: z.object({
    mode: z.enum(["code", "command"]).describe("Whether to run a code snippet or a shell command"),
    language: z.enum(["typescript", "javascript", "python"]).optional().describe("Language for code snippets"),
    content: z.string().describe("The code snippet or command to execute"),
    title: z.string().optional().describe("A descriptive title for this operation"),
  }),
  execute: async ({ mode, language, content, title }) => {
    console.log(`🚀 [Daytona] Executing ${mode}${language ? ` (${language})` : ""}...`);
    
    try {
      // Create a sandbox
      const sandbox = await daytona.create({
        language: language === "python" ? "python" : "typescript",
      });

      try {
        let result;
        if (mode === "code") {
          const run = await sandbox.process.codeRun(content);
          result = {
            success: run.exitCode === 0,
            output: run.result,
            exitCode: run.exitCode,
            title,
          };
        } else {
          // Execute command
          const proc = await sandbox.process.executeCommand(content);
          result = {
            success: proc.exitCode === 0,
            output: proc.result,
            exitCode: proc.exitCode,
            title,
          };
        }
        return result;
      } catch (innerError: any) {
        console.error("[Daytona] Execution Error:", innerError);
        return {
          success: false,
          error: innerError.message || "Runtime error during execution",
          title,
        };
      } finally {
        // Cleanup sandbox after execution
        await sandbox.delete();
      }
    } catch (outerError: any) {
      console.error("[Daytona] Sandbox Creation Error:", outerError);
      return {
        success: false,
        error: "Failed to provision sandbox environment. Check API key and quota.",
        details: outerError.message,
        title,
      };
    }
  },
});
