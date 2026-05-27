import 'dotenv/config';
import { PgVector } from '@mastra/pg';

const vectorStore = new PgVector({
  id: 'pgVector',
  connectionString: process.env.DATABASE_URL!,
});

await vectorStore.createIndex({
  indexName: 'cv_embeddings',
  dimension: 1536,
});

console.log('Index created ✅');
