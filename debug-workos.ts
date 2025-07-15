import dotenv from 'dotenv'
import { WorkOS } from '@workos-inc/node'
import { existsSync } from 'fs'
import { resolve } from 'path'

console.log('🔍 WorkOS Debug Script Starting...\n')

// Step 1: Check if .env file exists
const envPath = resolve(process.cwd(), '.env')
console.log('1️⃣  Checking .env file:')
console.log(`   Path: ${envPath}`)
console.log(`   Exists: ${existsSync(envPath) ? '✅ Yes' : '❌ No'}`)

// Step 2: Load dotenv config
console.log('\n2️⃣  Loading dotenv config:')
const dotenvResult = dotenv.config()
if (dotenvResult.error) {
  console.log('   ❌ Error loading .env:', dotenvResult.error.message)
} else {
  console.log('   ✅ Successfully loaded .env file')
}

// Step 3: Check all required WorkOS environment variables
console.log('\n3️⃣  Checking WorkOS environment variables:')
const requiredEnvVars = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_REDIRECT_URI',
  'WORKOS_SESSION_SECRET'
]

const envVarStatus: Record<string, boolean> = {}
let allEnvVarsPresent = true

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar]
  const isPresent = !!value
  envVarStatus[envVar] = isPresent
  
  if (!isPresent) {
    allEnvVarsPresent = false
    console.log(`   ❌ ${envVar}: Not found`)
  } else {
    // Mask sensitive values
    let displayValue = value
    if (envVar.includes('KEY') || envVar.includes('SECRET')) {
      displayValue = value.substring(0, 8) + '...' + value.substring(value.length - 4)
    }
    console.log(`   ✅ ${envVar}: ${displayValue}`)
  }
}

// Step 4: Try to initialize WorkOS client
console.log('\n4️⃣  Initializing WorkOS client:')
if (!process.env.WORKOS_API_KEY) {
  console.log('   ❌ Cannot initialize - WORKOS_API_KEY is missing')
} else {
  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY)
    console.log('   ✅ WorkOS client initialized successfully')
    
    // Step 5: Test authentication URL generation
    console.log('\n5️⃣  Testing authentication URL generation:')
    if (!process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_REDIRECT_URI) {
      console.log('   ❌ Cannot generate auth URL - missing CLIENT_ID or REDIRECT_URI')
    } else {
      try {
        const authUrl = workos.userManagement.getAuthorizationUrl({
          clientId: process.env.WORKOS_CLIENT_ID,
          redirectUri: process.env.WORKOS_REDIRECT_URI,
          provider: 'authkit',
        })
        console.log('   ✅ Auth URL generated successfully:')
        console.log(`      ${authUrl}`)
        
        // Parse and display URL components for debugging
        const url = new URL(authUrl)
        console.log('\n   📋 URL Components:')
        console.log(`      Host: ${url.host}`)
        console.log(`      Client ID: ${url.searchParams.get('client_id')}`)
        console.log(`      Redirect URI: ${url.searchParams.get('redirect_uri')}`)
        console.log(`      Response Type: ${url.searchParams.get('response_type')}`)
        console.log(`      Provider: ${url.searchParams.get('provider')}`)
      } catch (error) {
        console.log('   ❌ Error generating auth URL:', error)
      }
    }
  } catch (error) {
    console.log('   ❌ Error initializing WorkOS client:', error)
  }
}

// Step 6: Summary
console.log('\n📊 Summary:')
console.log('   .env file found:', existsSync(envPath) ? '✅' : '❌')
console.log('   dotenv loaded:', !dotenvResult.error ? '✅' : '❌')
console.log('   All env vars present:', allEnvVarsPresent ? '✅' : '❌')
console.log('   WorkOS client can initialize:', process.env.WORKOS_API_KEY ? '✅' : '❌')

// Step 7: Additional debugging info
console.log('\n🔧 Additional debugging info:')
console.log('   Current working directory:', process.cwd())
console.log('   Node environment:', process.env.NODE_ENV || 'not set')
console.log('   Total env vars loaded:', Object.keys(process.env).length)

// List all env vars that start with WORKOS (without values)
const workosEnvVars = Object.keys(process.env).filter(key => key.startsWith('WORKOS'))
console.log('   WorkOS-related env vars found:', workosEnvVars.join(', ') || 'none')

console.log('\n✨ Debug script completed!')