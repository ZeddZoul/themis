import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { renderToStream } from '@react-pdf/renderer';
import { ComplianceReportPDF } from '@/components/pdf/ComplianceReportPDF';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repoName, branchName, checkType, summary, issues, checkRunId } = body;

    if (!repoName || !summary || !issues) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Prepare data for PDF
    const data = {
      repoName,
      branchName,
      checkType,
      date: new Date().toLocaleDateString(),
      summary,
      issues,
    };

    // Render PDF to stream
    const stream = await renderToStream(<ComplianceReportPDF data={data} />);
    
    // Convert stream to buffer (Next.js App Router needs Response with body)
    // Or we can return a ReadableStream.
    // renderToStream returns a NodeJS.ReadableStream.
    // We can convert it to a Web ReadableStream or just read it into a buffer.
    
    // Helper to convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="themis-report-${repoName.split('/')[1]}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
