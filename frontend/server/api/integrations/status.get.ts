import { createServerSupabaseClient } from '../../utils/supabase'

const PENSOPAY_API_KEY = process.env.PENSOPAY_API_KEY
const PENSOPAY_BASE_URL = 'https://api.pensopay.com/v2'

export default defineEventHandler(async (event) => {
  const statuses: any = {
    timestamp: new Date().toISOString(),
    services: {}
  }

  // Check Supabase/Database
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Product')
      .select('id')
      .limit(1)
    
    if (error) {
      statuses.services.database = {
        status: 'down',
        message: error.message,
        name: 'Supabase Database'
      }
    } else {
      statuses.services.database = {
        status: 'up',
        message: 'Connected',
        name: 'Supabase Database'
      }
    }
  } catch (err: any) {
    statuses.services.database = {
      status: 'down',
      message: err.message || 'Connection failed',
      name: 'Supabase Database'
    }
  }

  // Check PensoPay
  try {
    if (!PENSOPAY_API_KEY) {
      statuses.services.pensopay = {
        status: 'warning',
        message: 'API key not configured',
        name: 'PensoPay'
      }
    } else {
      // Test PensoPay connection by fetching account info
      const response = await fetch(`${PENSOPAY_BASE_URL}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PENSOPAY_API_KEY}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const accountData = await response.json()
        statuses.services.pensopay = {
          status: 'up',
          message: 'Connected',
          name: 'PensoPay',
          details: {
            merchant: accountData.merchant_name || 'N/A',
            testMode: accountData.test_mode || false
          }
        }
      } else {
        statuses.services.pensopay = {
          status: 'down',
          message: `HTTP ${response.status}`,
          name: 'PensoPay'
        }
      }
    }
  } catch (err: any) {
    statuses.services.pensopay = {
      status: 'down',
      message: err.message || 'Connection failed',
      name: 'PensoPay'
    }
  }

  // Check Email Service (via environment variables)
  const emailConfigured = !!(
    process.env.RESEND_API_KEY || 
    (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
  )
  
  const emailDetails: string[] = []
  
  if (process.env.RESEND_API_KEY) {
    emailDetails.push('✅ RESEND_API_KEY er konfigureret')
  }
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailDetails.push('✅ Simply.com SMTP er konfigureret')
    emailDetails.push(`Email: ${process.env.EMAIL_USER}`)
    if (process.env.EMAIL_FROM_NAME) {
      emailDetails.push(`Afsender navn: ${process.env.EMAIL_FROM_NAME}`)
    }
  } else {
    const missing = []
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER')
    if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD')
    if (missing.length > 0 && !process.env.RESEND_API_KEY) {
      emailDetails.push(`❌ Email konfiguration mangler: ${missing.join(', ')}`)
    }
  }
  
  if (emailConfigured) {
    statuses.services.email = {
      status: 'up',
      message: process.env.RESEND_API_KEY ? 'Resend konfigureret' : 'Simply.com SMTP konfigureret',
      name: 'Email Tjeneste',
      details: emailDetails
    }
  } else {
    statuses.services.email = {
      status: 'warning',
      message: 'Ikke konfigureret',
      name: 'Email Tjeneste',
      details: emailDetails
    }
  }

  // Overall health
  const allUp = Object.values(statuses.services).every(
    (service: any) => service.status === 'up'
  )
  const anyDown = Object.values(statuses.services).some(
    (service: any) => service.status === 'down'
  )

  statuses.overall = anyDown ? 'degraded' : (allUp ? 'healthy' : 'warning')

  return statuses
})
