import path from 'path'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config } from 'dotenv'
config()

const connectionString = process.env.DATABASE_URL!

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: connectionString,
  },
})