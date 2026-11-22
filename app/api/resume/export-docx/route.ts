import { NextResponse } from 'next/server';
import { generateDocxResume } from '@/lib/resumeDocx';
import { ATSResumeContent } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const resume: ATSResumeContent = await req.json();
    if (!resume || !resume.fullName) {
      return NextResponse.json({ error: 'Valid resume data required' }, { status: 400 });
    }

    const docxBuffer = await generateDocxResume(resume);

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${resume.fullName.replace(/\s+/g, '_')}_Resume.docx"`,
      },
    });
  } catch (err: any) {
    console.error('DOCX Export error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
