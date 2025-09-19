const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAdminUser() {
  try {
    const email = process.argv[2] || 'admin@linkbio.com'
    const password = process.argv[3] || 'admin123'
    const role = process.argv[4] || 'admin'

    console.log('Creating admin user...')
    console.log('Email:', email)
    console.log('Role:', role)

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('AdminUser')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAdmin) {
      console.log('❌ Admin user already exists with this email')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    const { data: admin, error } = await supabase
      .from('AdminUser')
      .insert({
        email,
        password: hashedPassword,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating admin user:', error)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('ID:', admin.id)
    console.log('Email:', admin.email)
    console.log('Role:', admin.role)
    console.log('')
    console.log('You can now login at: http://localhost:3001/admin/login')
    console.log('Email:', email)
    console.log('Password:', password)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createAdminUser()