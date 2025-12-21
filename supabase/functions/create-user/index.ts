import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 user creations per minute

// In-memory rate limit store (per instance - for production use Redis/Supabase)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

// Validation constants
const VALID_ROLES = ['parent', 'driver', 'chef', 'cleaner', 'other'] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_USERNAME_LENGTH = 50;
const MAX_PHONE_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;

// Password complexity requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Can enable for stricter security
};

// Sanitize string input
function sanitizeString(input: string, maxLength: number): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS characters
}

// Validate email format
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

// Validate role
function isValidRole(role: string): role is typeof VALID_ROLES[number] {
  return VALID_ROLES.includes(role as typeof VALID_ROLES[number]);
}

// Validate phone number (basic validation)
function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Optional field
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

// Validate password complexity
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { valid: false, message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters` };
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the requesting user is a parent
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('Create user failed: No authorization header')
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      console.log('Create user failed: Invalid token or user not found')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limiting check
    if (isRateLimited(requestingUser.id)) {
      console.log(`Create user failed: Rate limit exceeded for user ${requestingUser.id}`)
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please wait before creating more users.',
        retryAfter: 60 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      })
    }

    // Check if requesting user is a parent
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single()

    if (roleData?.role !== 'parent') {
      console.log(`Create user failed: User ${requestingUser.id} is not a parent`)
      return new Response(JSON.stringify({ error: 'Only parents can create users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get and validate request body
    let body;
    try {
      body = await req.json()
    } catch {
      console.log('Create user failed: Invalid JSON body')
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, name, username, role, phone_number } = body

    // Validate required fields exist
    if (!email || !password || !name || !username || !role) {
      console.log('Create user failed: Missing required fields')
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, name, username, and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate field types
    if (typeof email !== 'string' || typeof password !== 'string' || 
        typeof name !== 'string' || typeof username !== 'string' || typeof role !== 'string') {
      console.log('Create user failed: Invalid field types')
      return new Response(JSON.stringify({ error: 'Invalid field types' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate email format
    if (!isValidEmail(email.trim())) {
      console.log('Create user failed: Invalid email format')
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('Create user failed: Password does not meet requirements')
      return new Response(JSON.stringify({ error: passwordValidation.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate name
    const sanitizedName = sanitizeString(name, MAX_NAME_LENGTH);
    if (sanitizedName.length < 1) {
      console.log('Create user failed: Name is empty')
      return new Response(JSON.stringify({ error: 'Name cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate username
    const sanitizedUsername = sanitizeString(username, MAX_USERNAME_LENGTH);
    if (sanitizedUsername.length < 1) {
      console.log('Create user failed: Username is empty')
      return new Response(JSON.stringify({ error: 'Username cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate role
    if (!isValidRole(role)) {
      console.log(`Create user failed: Invalid role "${role}"`)
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate phone number if provided
    if (phone_number && typeof phone_number === 'string' && !isValidPhone(phone_number)) {
      console.log('Create user failed: Invalid phone number')
      return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sanitizedPhone = phone_number ? sanitizeString(phone_number, MAX_PHONE_LENGTH) : null;

    console.log(`Creating user with email: ${email.trim()}, role: ${role}`)

    // Create user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (createError) {
      console.log(`Create user failed: ${createError.message}`)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        name: sanitizedName,
        username: sanitizedUsername,
        phone_number: sanitizedPhone,
        status: 'active',
      })

    if (profileError) {
      console.log(`Profile creation failed: ${profileError.message}`)
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role,
      })

    if (roleError) {
      console.log(`Role creation failed: ${roleError.message}`)
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`User created successfully: ${newUser.user.id}`)

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: newUser.user.id, email: newUser.user.email } 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Create user unexpected error: ${message}`)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
