const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  try {
    const email = 'admin@lynxninja.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('AdminUser')
      .insert({
        email,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', 'super_admin');
    console.log('ID:', data.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
