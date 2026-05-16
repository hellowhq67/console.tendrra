import Parallel from "parallel-web";

let client: Parallel | null = null;

function getClient(): Parallel {
  const key = process.env.PARALLEL_API_KEY;
  if (!key) {
    throw new Error("PARALLEL_API_KEY is not set");
  }
  if (!client) {
    client = new Parallel({ apiKey: key });
  }
  return client;
}

export async function search(objective: string, queries: string[]) {
  return await getClient().search({
    objective,
    search_queries: queries,
  });
}

export async function extract(url: string, objective: string, schema?: any) {
  return await getClient().search({
    objective: `Extract ${objective} from ${url}`,
    search_queries: [url],
  });
}

export async function deepResearch(objective: string) {
  console.log("Starting deep research for:", objective);

  const initialSearch = await getClient().search({
    objective: `Gather comprehensive initial information for: ${objective}`,
    search_queries: [objective],
  });

  return initialSearch;
}
