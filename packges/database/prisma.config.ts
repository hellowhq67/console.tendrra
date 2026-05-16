/// <reference types="node" />
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
