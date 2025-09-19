#!/usr/bin/env node

/**
 * Run Admin Migration Script
 * 
 * This script runs the admin system migration to create the necessary tables.
 * 
 * Usage: node scripts/run-admin-migration.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

async function runAdminMigration() {
  console.log('🔧 Running Admin System Migration')
  console.log('==================================\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '016_admin_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded successfully')
    console.log('📋 Migration includes:')
    console.log('   - AdminUser table')
    console.log('   - FeatureFlag table')
    console.log('   - SystemSetting table')
    console.log('   - SystemLog table')
    console.log('   - AdminSession table')
    console.log('   - Default feature flags and settings')
    console.log('   - Helper functions')

    console.log('\n⚠️  IMPORTANT: You need to run this migration manually in Supabase:')
    console.log('   1. Go to your Supabase project dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and paste the contents of: migrations/016_admin_system.sql')
    console.log('   4. Click "Run" to execute the migration')
    console.log('\n📁 Migration file location: migrations/016_admin_system.sql')

    console.log('\n✅ After running the migration, you can:')
    console.log('   1. Create an admin user: node scripts/create-admin.js')
    console.log('   2. Access the admin panel: /admin/login')

  } catch (error) {
    console.error('❌ Error reading migration file:', error.message)
    process.exit(1)
  }
}

// Run the script
runAdminMigration()
