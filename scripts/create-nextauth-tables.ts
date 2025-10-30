/**
 * Create NextAuth tables with standard names
 * Run: npx tsx scripts/create-nextauth-tables.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  console.log('🚀 Creating NextAuth tables...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  try {
    // Read SQL migration file
    const migrationPath = join(process.cwd(), 'lib/database/migrations/create-nextauth-tables.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Reading migration from:', migrationPath);

    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    try {
      // Begin transaction
      await client.query('BEGIN');
      console.log('🔄 Starting transaction...\n');

      // Execute migration SQL
      console.log('📝 Creating NextAuth tables...');
      await client.query(migrationSql);

      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully!\n');

      // Verify tables were created
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
        ORDER BY table_name;
      `);

      console.log('📊 Created tables:');
      result.rows.forEach((row) => {
        console.log(`   ✓ ${row.table_name}`);
      });

      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Restart your development server: npm run dev');
      console.log('   2. Try email login again');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
createTables();

