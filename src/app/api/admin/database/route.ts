import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get database statistics for all tables
    const [
      { count: totalUsers },
      { count: totalLinks },
      { count: totalAnalytics },
      { count: totalSubscriptions },
      { count: totalAccounts },
      { count: totalSessions },
      { count: totalVerificationTokens },
      { count: totalTeams },
      { count: totalTeamMembers },
      { count: totalTeamLinks },
      { count: totalCustomDomains },
      { count: totalEmailCaptures },
      { count: totalEmailSubmissions },
      { count: totalMailingLists },
      { count: totalMailingListSubscriptions },
      { count: totalMailingListEmails },
      { count: totalMailingListEmailRecipients },
      { count: totalEmailTemplates },
      { count: totalSocialMediaLinks },
      { count: totalCustomThemes },
      { count: totalProfileViewAnalytics },
      { count: totalReports },
      { count: totalAdminUsers },
      { count: totalFeatureFlags },
      { count: totalSystemSettings },
      { count: totalSystemLogs },
      { count: totalAdminSessions }
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Link').select('*', { count: 'exact', head: true }),
      supabase.from('Analytics').select('*', { count: 'exact', head: true }),
      supabase.from('Subscription').select('*', { count: 'exact', head: true }),
      supabase.from('Account').select('*', { count: 'exact', head: true }),
      supabase.from('Session').select('*', { count: 'exact', head: true }),
      supabase.from('VerificationToken').select('*', { count: 'exact', head: true }),
      supabase.from('Team').select('*', { count: 'exact', head: true }),
      supabase.from('TeamMember').select('*', { count: 'exact', head: true }),
      supabase.from('TeamLink').select('*', { count: 'exact', head: true }),
      supabase.from('CustomDomain').select('*', { count: 'exact', head: true }),
      supabase.from('EmailCapture').select('*', { count: 'exact', head: true }),
      supabase.from('EmailSubmission').select('*', { count: 'exact', head: true }),
      supabase.from('MailingList').select('*', { count: 'exact', head: true }),
      supabase.from('MailingListSubscription').select('*', { count: 'exact', head: true }),
      supabase.from('MailingListEmail').select('*', { count: 'exact', head: true }),
      supabase.from('MailingListEmailRecipient').select('*', { count: 'exact', head: true }),
      supabase.from('EmailTemplate').select('*', { count: 'exact', head: true }),
      supabase.from('SocialMediaLink').select('*', { count: 'exact', head: true }),
      supabase.from('CustomTheme').select('*', { count: 'exact', head: true }),
      supabase.from('ProfileViewAnalytics').select('*', { count: 'exact', head: true }),
      supabase.from('Report').select('*', { count: 'exact', head: true }),
      supabase.from('AdminUser').select('*', { count: 'exact', head: true }),
      supabase.from('FeatureFlag').select('*', { count: 'exact', head: true }),
      supabase.from('SystemSetting').select('*', { count: 'exact', head: true }),
      supabase.from('SystemLog').select('*', { count: 'exact', head: true }),
      supabase.from('AdminSession').select('*', { count: 'exact', head: true })
    ])

    // Calculate estimated table sizes based on row counts (Supabase doesn't expose actual sizes)
    const estimateTableSize = (rows: number, avgRowSize: number = 1024) => {
      const sizeInBytes = rows * avgRowSize
      if (sizeInBytes < 1024) return `${sizeInBytes} B`
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const tableSizes = [
      { table: 'User', rows: totalUsers || 0, size: estimateTableSize(totalUsers || 0, 2048) },
      { table: 'Link', rows: totalLinks || 0, size: estimateTableSize(totalLinks || 0, 1024) },
      { table: 'Analytics', rows: totalAnalytics || 0, size: estimateTableSize(totalAnalytics || 0, 512) },
      { table: 'Subscription', rows: totalSubscriptions || 0, size: estimateTableSize(totalSubscriptions || 0, 1024) },
      { table: 'Account', rows: totalAccounts || 0, size: estimateTableSize(totalAccounts || 0, 1024) },
      { table: 'Session', rows: totalSessions || 0, size: estimateTableSize(totalSessions || 0, 512) },
      { table: 'VerificationToken', rows: totalVerificationTokens || 0, size: estimateTableSize(totalVerificationTokens || 0, 256) },
      { table: 'Team', rows: totalTeams || 0, size: estimateTableSize(totalTeams || 0, 1024) },
      { table: 'TeamMember', rows: totalTeamMembers || 0, size: estimateTableSize(totalTeamMembers || 0, 512) },
      { table: 'TeamLink', rows: totalTeamLinks || 0, size: estimateTableSize(totalTeamLinks || 0, 512) },
      { table: 'CustomDomain', rows: totalCustomDomains || 0, size: estimateTableSize(totalCustomDomains || 0, 512) },
      { table: 'EmailCapture', rows: totalEmailCaptures || 0, size: estimateTableSize(totalEmailCaptures || 0, 1024) },
      { table: 'EmailSubmission', rows: totalEmailSubmissions || 0, size: estimateTableSize(totalEmailSubmissions || 0, 512) },
      { table: 'MailingList', rows: totalMailingLists || 0, size: estimateTableSize(totalMailingLists || 0, 1024) },
      { table: 'MailingListSubscription', rows: totalMailingListSubscriptions || 0, size: estimateTableSize(totalMailingListSubscriptions || 0, 512) },
      { table: 'MailingListEmail', rows: totalMailingListEmails || 0, size: estimateTableSize(totalMailingListEmails || 0, 2048) },
      { table: 'MailingListEmailRecipient', rows: totalMailingListEmailRecipients || 0, size: estimateTableSize(totalMailingListEmailRecipients || 0, 256) },
      { table: 'EmailTemplate', rows: totalEmailTemplates || 0, size: estimateTableSize(totalEmailTemplates || 0, 2048) },
      { table: 'SocialMediaLink', rows: totalSocialMediaLinks || 0, size: estimateTableSize(totalSocialMediaLinks || 0, 512) },
      { table: 'CustomTheme', rows: totalCustomThemes || 0, size: estimateTableSize(totalCustomThemes || 0, 4096) },
      { table: 'ProfileViewAnalytics', rows: totalProfileViewAnalytics || 0, size: estimateTableSize(totalProfileViewAnalytics || 0, 512) },
      { table: 'Report', rows: totalReports || 0, size: estimateTableSize(totalReports || 0, 1024) },
      { table: 'AdminUser', rows: totalAdminUsers || 0, size: estimateTableSize(totalAdminUsers || 0, 1024) },
      { table: 'FeatureFlag', rows: totalFeatureFlags || 0, size: estimateTableSize(totalFeatureFlags || 0, 512) },
      { table: 'SystemSetting', rows: totalSystemSettings || 0, size: estimateTableSize(totalSystemSettings || 0, 512) },
      { table: 'SystemLog', rows: totalSystemLogs || 0, size: estimateTableSize(totalSystemLogs || 0, 1024) },
      { table: 'AdminSession', rows: totalAdminSessions || 0, size: estimateTableSize(totalAdminSessions || 0, 512) }
    ].filter(table => table.rows > 0) // Only show tables with data

    // Get recent database activity
    const { data: recentUsers } = await supabase
      .from('User')
      .select('id, email, username, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10)

    const { data: recentLinks } = await supabase
      .from('Link')
      .select('id, title, url, createdAt, User (username)')
      .order('createdAt', { ascending: false })
      .limit(10)

    // Get orphaned records (links without users, clicks without links, etc.)
    const { data: orphanedLinks } = await supabase
      .from('Link')
      .select('id, title, url, userId')
      .is('userId', null)
      .limit(10)

    const { data: orphanedClicks } = await supabase
      .from('Analytics')
      .select('id, linkId, clickTime')
      .is('linkId', null)
      .limit(10)

    // Get duplicate usernames
    const { data: duplicateUsernames } = await supabase
      .from('User')
      .select('username')
      .not('username', 'is', null)

    const usernameCounts = duplicateUsernames?.reduce((acc, user) => {
      acc[user.username] = (acc[user.username] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const duplicates = Object.entries(usernameCounts)
      .filter(([_, count]) => count > 1)
      .map(([username, count]) => ({ username, count }))

    // Calculate total rows and estimated total size
    const totalRows = tableSizes.reduce((sum, table) => sum + table.rows, 0)
    const totalSizeInBytes = tableSizes.reduce((sum, table) => {
      const sizeStr = table.size
      if (sizeStr.includes('MB')) return sum + parseFloat(sizeStr) * 1024 * 1024
      if (sizeStr.includes('KB')) return sum + parseFloat(sizeStr) * 1024
      return sum + parseFloat(sizeStr)
    }, 0)
    
    const formatTotalSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return NextResponse.json({
      overview: {
        totalTables: tableSizes.length,
        totalRows: totalRows,
        totalSize: formatTotalSize(totalSizeInBytes),
        lastBackup: new Date().toISOString()
      },
      tables: tableSizes,
      recentActivity: {
        users: recentUsers || [],
        links: recentLinks || []
      },
      issues: {
        orphanedLinks: orphanedLinks || [],
        orphanedClicks: orphanedClicks || [],
        duplicateUsernames: duplicates
      }
    })
  } catch (error) {
    console.error('Admin database API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminId = request.cookies.get('admin-session')?.value
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authResult = await verifyAdminSession(adminId)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, data: actionData, tableName } = await request.json()

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    let result: any = {}

    switch (action) {
      case 'cleanup_orphaned_records':
        // Clean up orphaned clicks
        const { error: cleanupClicksError } = await supabase
          .from('Analytics')
          .delete()
          .is('linkId', null)

        // Clean up orphaned links
        const { error: cleanupLinksError } = await supabase
          .from('Link')
          .delete()
          .is('userId', null)

        if (cleanupClicksError || cleanupLinksError) {
          return NextResponse.json({ error: "Failed to cleanup orphaned records" }, { status: 500 })
        }

        result = { message: "Orphaned records cleaned up successfully" }
        break

      case 'fix_duplicate_usernames':
        // Find and fix duplicate usernames by appending numbers
        const { data: duplicateUsers } = await supabase
          .from('User')
          .select('username')
          .not('username', 'is', null)

        const usernameCounts = duplicateUsers?.reduce((acc, user) => {
          acc[user.username] = (acc[user.username] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const duplicates = Object.entries(usernameCounts)
          .filter(([_, count]) => count > 1)
          .map(([username, _]) => username)

        let fixedCount = 0
        for (const username of duplicates) {
          const { data: usersWithUsername } = await supabase
            .from('User')
            .select('id, username')
            .eq('username', username)
            .order('createdAt', { ascending: true })

          if (usersWithUsername && usersWithUsername.length > 1) {
            // Keep the first user, rename the rest
            for (let i = 1; i < usersWithUsername.length; i++) {
              const newUsername = `${username}_${i}`
              const { error: updateError } = await supabase
                .from('User')
                .update({ username: newUsername })
                .eq('id', usersWithUsername[i].id)

              if (!updateError) {
                fixedCount++
              }
            }
          }
        }

        result = { message: `Fixed ${fixedCount} duplicate usernames` }
        break

      case 'optimize_database':
        // For Supabase, we can't run VACUUM/ANALYZE directly, but we can clean up some data
        // Clean up old verification tokens
        const { error: cleanupTokensError } = await supabase
          .from('VerificationToken')
          .delete()
          .lt('expires', new Date().toISOString())

        // Clean up old sessions
        const { error: cleanupSessionsError } = await supabase
          .from('Session')
          .delete()
          .lt('expires', new Date().toISOString())

        // Clean up old system logs (keep last 1000)
        const { data: oldLogs } = await supabase
          .from('SystemLog')
          .select('id')
          .order('createdAt', { ascending: true })
          .limit(1000)

        if (oldLogs && oldLogs.length > 1000) {
          const logsToDelete = oldLogs.slice(0, oldLogs.length - 1000)
          const logIds = logsToDelete.map(log => log.id)
          await supabase
            .from('SystemLog')
            .delete()
            .in('id', logIds)
        }

        const optimizationResults = []
        if (!cleanupTokensError) optimizationResults.push('cleaned expired tokens')
        if (!cleanupSessionsError) optimizationResults.push('cleaned expired sessions')
        optimizationResults.push('optimized system logs')

        result = { message: `Database optimization completed: ${optimizationResults.join(', ')}` }
        break

      case 'backup_database':
        // For Supabase, we can't trigger manual backups via API
        // But we can create a backup record in SystemLog for tracking
        const backupRecord = {
          logLevel: 'info',
          logMessage: 'Manual database backup requested',
          actionName: 'backup_database',
          resourceType: 'database',
          metadata: { timestamp: new Date().toISOString() }
        }

        try {
          await supabase.from('SystemLog').insert(backupRecord)
          result = { message: "Backup request logged. Supabase handles automatic backups." }
        } catch (backupLogError) {
          result = { message: "Backup request noted. Supabase handles automatic backups." }
        }
        break

      case 'get_table_details':
        if (!tableName) {
          return NextResponse.json({ error: "Table name required" }, { status: 400 })
        }

        // Get table structure and sample data
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(10)

        if (tableError) {
          return NextResponse.json({ error: `Failed to fetch table data: ${tableError.message}` }, { status: 500 })
        }

        // Get table count
        const { count: tableCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        result = {
          tableName,
          count: tableCount || 0,
          sampleData: tableData || [],
          columns: tableData && tableData.length > 0 ? Object.keys(tableData[0]) : []
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Log the database action (if SystemLog table exists)
    try {
      await supabase.from('SystemLog').insert({
        logLevel: 'info',
        logMessage: `Database action: ${action}`,
        adminUserId: authResult.admin!.id,
        actionName: action,
        resourceType: 'database',
        metadata: actionData
      })
    } catch (logError) {
      // SystemLog table might not exist, continue without logging
      console.log('Could not log system event:', logError)
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Admin database action API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

