const { PrismaClient } = require('@prisma/client')

async function check() {
  const prisma = new PrismaClient()
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        migration_name,
        logs,
        rolled_back_at,
        execution_time_ms,
        finished_at
      FROM _prisma_migrations 
      WHERE migration_name = '20260718_phase_13_2_verification_status'
    `
    console.log('[v0] Migration record found:', result.length > 0 ? 'YES' : 'NO')
    if (result.length > 0) {
      console.log('[v0] Migration details:')
      console.log('  Name:', result[0].migration_name)
      console.log('  Execution time (ms):', result[0].execution_time_ms)
      console.log('  Finished at:', result[0].finished_at)
      console.log('  Rolled back at:', result[0].rolled_back_at)
      console.log('[v0] Error logs:')
      console.log(result[0].logs || '(no logs)')
    }
  } catch (e) {
    console.error('[v0] Query error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

check()
