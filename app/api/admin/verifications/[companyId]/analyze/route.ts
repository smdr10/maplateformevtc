import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/middleware/requireAuth'
import { runCompanyAnalysis } from '@/lib/verificationRuns'

// Relance l'analyse automatique (ex. registre indisponible lors de l'envoi)
export async function POST(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { companyId } = await params
    const review = await runCompanyAnalysis(companyId)
    return NextResponse.json({ review })
  } catch (error) {
    console.error('[ADMIN REANALYZE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
