import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// This endpoint should ideally be called by a cron job every night
// For now, it can be triggered manually or by the dashboard (lazy aggregation)
export async function POST(request: Request) {
  const session = await getSession();
  const apiKey = request.headers.get('x-api-key');

  // Allow API Key or Admin Session
  if (!session.isLoggedIn && !apiKey) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (apiKey) {
    const user = await prisma.user.findUnique({ where: { apiKey } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }
  }

  try {
    // Calculate stats for today (or provided date)
    // For simplicity, we'll aggregate "today so far" or "yesterday"
    // Let's aggregate ALL time by day if we want to backfill, but that's expensive.
    // Let's just aggregate "today" for now.
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checks = await prisma.checkRun.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
    });

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'COMPLETED' && !c.errorType).length; // Assuming COMPLETED means passed logic, but actually status is COMPLETED even if issues found.
    // Let's refine: COMPLETED means it ran. PASS means no issues?
    // The current logic says status='COMPLETED' even if issues found.
    // Let's assume "Passed" means 0 high severity issues? Or just "Completed successfully"?
    // Usually "Passed" means compliance passed.
    // Let's look at issues.
    
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;
    let totalIssues = 0;
    let passedCount = 0;

    for (const check of checks) {
      const issues = (check.issues as any[]) || [];
      const high = issues.filter((i: any) => i.severity === 'high').length;
      const medium = issues.filter((i: any) => i.severity === 'medium').length;
      const low = issues.filter((i: any) => i.severity === 'low').length;

      highSeverity += high;
      mediumSeverity += medium;
      lowSeverity += low;
      totalIssues += issues.length;

      if (high === 0 && check.status === 'COMPLETED') {
        passedCount++;
      }
    }

    // Calculate average score (simple heuristic: 100 - (high*10 + medium*5 + low*1))
    // Clamped to 0-100
    let totalScore = 0;
    if (totalChecks > 0) {
      for (const check of checks) {
        const issues = (check.issues as any[]) || [];
        const high = issues.filter((i: any) => i.severity === 'high').length;
        const medium = issues.filter((i: any) => i.severity === 'medium').length;
        const low = issues.filter((i: any) => i.severity === 'low').length;
        
        const penalty = (high * 20) + (medium * 5) + (low * 1);
        const score = Math.max(0, 100 - penalty);
        totalScore += score;
      }
    }
    
    const averageScore = totalChecks > 0 ? totalScore / totalChecks : 100;

    // Upsert DailyStats
    const stats = await prisma.dailyStats.upsert({
      where: { date: today },
      update: {
        totalChecks,
        passedChecks: passedCount,
        failedChecks: totalChecks - passedCount,
        totalIssues,
        highSeverity,
        mediumSeverity,
        lowSeverity,
        averageScore,
      },
      create: {
        date: today,
        totalChecks,
        passedChecks: passedCount,
        failedChecks: totalChecks - passedCount,
        totalIssues,
        highSeverity,
        mediumSeverity,
        lowSeverity,
        averageScore,
      },
    });

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Failed to aggregate stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
