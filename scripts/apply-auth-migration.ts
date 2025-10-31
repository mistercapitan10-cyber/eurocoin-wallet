/**
 * Apply NextAuth Database Migration
 * Creates all necessary tables for OAuth authentication
 *
 * Run: npx tsx scripts/apply-auth-migration.ts
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

async function applyMigration() {
  console.log('🚀 Starting NextAuth database migration...\n');

  try {
    // Read SQL schema file
    const schemaPath = join(process.cwd(), 'lib/database/auth-schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    console.log('📄 Reading schema from:', schemaPath);

    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    try {
      const alreadyApplied = await client
        .query(
          `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'auth_users'
        ) AS present;
      `,
        )
        .then((result) => result.rows[0]?.present === true);

      if (alreadyApplied) {
        console.log('✅ Migration already applied: auth tables already exist');
        return;
      }

      // Begin transaction
      await client.query('BEGIN');
      console.log('🔄 Starting transaction...\n');

      // Execute schema SQL
      console.log('📝 Creating auth tables...');
      await client.query(schemaSql);

      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully!\n');

      // Verify tables were created
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name LIKE 'auth_%'
        ORDER BY table_name;
      `);

      console.log('📊 Created tables:');
      result.rows.forEach((row) => {
        console.log(`   ✓ ${row.table_name}`);
      });

      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Configure OAuth providers in .env.local');
      console.log('   2. Generate NEXTAUTH_SECRET: openssl rand -base64 32');
      console.log('   3. Set up Google OAuth credentials');
      console.log('   4. Set up GitHub OAuth credentials');
      console.log('   5. Run the app: npm run dev');
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
applyMigration();
