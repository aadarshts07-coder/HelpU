import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_claude_api_key_here') {
    return null;
  }
  return new Anthropic({ apiKey });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      jobTitle = 'Software Engineer',
      company = 'Company',
      recipientName = 'Hiring Manager',
      recipientRole = 'Technical Recruiter',
      matchScore = 85,
    } = body;

    const profile = await db.getProfile();
    const client = getAnthropicClient();

    const candidateName = profile?.name || 'Applicant';
    const candidateSummary = profile?.summary || 'Experienced builder passionate about modern software and scalable architecture.';
    const topSkills = profile?.skills?.slice(0, 5).map(s => s.name).join(', ') || 'React, TypeScript, Node.js';
    const topProject = profile?.projects?.[0]?.title || 'high-impact enterprise applications';

    if (client) {
      try {
        const prompt = `You are an elite career strategist. Draft 3 distinct high-converting outreach messages for ${candidateName} targeting the role "${jobTitle}" at "${company}".
The recipient is ${recipientName} (${recipientRole}).
Candidate top skills: ${topSkills}
Top project: ${topProject}
Candidate summary: ${candidateSummary}

Return ONLY valid JSON matching this exact structure:
{
  "linkedin": "A LinkedIn connection request note under 290 characters total. Punchy, humble, specific to ${company}.",
  "inmail": {
    "subject": "Compelling subject line under 60 chars",
    "body": "A 3-paragraph direct email or InMail. Paragraph 1: Enthusiastic hook mentioning the ${jobTitle} opening. Paragraph 2: Two crisp bullet points of relevant achievements. Paragraph 3: Low-friction call to action."
  },
  "followUp": {
    "subject": "Follow-up subject line",
    "body": "A polite follow-up note to be sent 5-7 days after application submission, reiterating excitement and offering a quick link to work."
  }
}`;

        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return NextResponse.json({ success: true, templates: parsed });
        }
      } catch (claudeErr) {
        console.warn('Claude API outreach error, using local generator:', claudeErr);
      }
    }

    // High quality local deterministic generator
    const linkedinNote = `Hi ${recipientName}, I came across the ${jobTitle} role at ${company} and was really impressed by your team's work. With experience building ${topProject} using ${topSkills}, I'd love to connect and follow your team's updates!`;

    const inmailSubject = `Application for ${jobTitle} — ${candidateName}`;
    const inmailBody = `Hi ${recipientName},

I hope you're having a productive week!

I recently submitted my application for the ${jobTitle} opening at ${company}. Given your team's growth, I wanted to reach out directly to express my genuine enthusiasm.

A quick snapshot of what I bring to the table:
• Proven track record delivering scalable features with ${topSkills}.
• Built and shipped ${topProject}, focusing on reliability, user experience, and clean code.
• Collaborative mindset with a strong drive to learn and contribute to ${company}'s roadmap.

I would welcome the opportunity to chat if you're open to a brief 10-minute conversation. Thank you for your time and consideration!

Warm regards,
${candidateName}
${profile?.portfolioUrl ? `Portfolio: ${profile.portfolioUrl}` : ''}
${profile?.linkedInUrl ? `LinkedIn: ${profile.linkedInUrl}` : ''}`;

    const followUpSubject = `Following up on ${jobTitle} application — ${candidateName}`;
    const followUpBody = `Hi ${recipientName},

I hope you're doing well.

I wanted to briefly follow up on the application I submitted for the ${jobTitle} role at ${company} last week. I remain very enthusiastic about the opportunity to contribute to your engineering team.

I know how busy hiring cycles can be, so please don't hesitate to reach out if you need any additional portfolio samples or code references.

Looking forward to the possibility of connecting!

Best regards,
${candidateName}`;

    return NextResponse.json({
      success: true,
      templates: {
        linkedin: linkedinNote.slice(0, 290),
        inmail: {
          subject: inmailSubject,
          body: inmailBody,
        },
        followUp: {
          subject: followUpSubject,
          body: followUpBody,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate outreach' }, { status: 500 });
  }
}
