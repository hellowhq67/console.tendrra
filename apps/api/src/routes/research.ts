import { Router } from "express";
import { search, extract, deepResearch } from "../lib/parallel.js";

const router = Router();

// Mock job creation for async operations
let mockJobCounter = 1;
const mockJobs = new Map();

router.post("/search", async (req, res) => {
  const { objective, queries, userId } = req.body;
  try {
    const results = await search(objective, queries);

    // Mock saving to ResearchArtifacts (just log for testing)
    if (userId) {
      console.log(`[MOCK] Saved search artifact for user ${userId}: ${objective}`);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/extract", async (req, res) => {
  const { url, objective, userId } = req.body;
  try {
    const results = await extract(url, objective);

    if (userId) {
      console.log(`[MOCK] Saved extract artifact for user ${userId}: ${url}`);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post("/deep-research", async (req, res) => {
  const { objective, userId, async } = req.body;
  try {
    if (async) {
      if (!userId) return res.status(400).json({ error: "userId required for async runs" });

      const jobId = `job-${mockJobCounter++}`;
      const job = {
        id: jobId,
        type: "DEEP_RESEARCH",
        status: "QUEUED",
        payload: { objective },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJobs.set(jobId, job);
      console.log(`[MOCK] Created async job ${jobId} for user ${userId}`);

      return res.status(202).json({ jobId: job.id, status: "QUEUED" });
    }

    const results = await deepResearch(objective);

    if (userId) {
      console.log(`[MOCK] Saved deep research artifact for user ${userId}: ${objective}`);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
