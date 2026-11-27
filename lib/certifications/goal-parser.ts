import Anthropic from '@anthropic-ai/sdk';
import { GoalUnderstanding, GoalUnderstandingSchema } from './types';

export async function parseGoalUnderstanding(
  goal: string,
  timeline: string = '3 months',
  userSkills: string[] = []
): Promise<GoalUnderstanding> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey !== 'demo_key') {
    try {
      const client = new Anthropic({ apiKey });
      const prompt = `Analyze this career goal:
Goal: "${goal}"
Target Timeline: "${timeline}"
User Skills: ${userSkills.length > 0 ? userSkills.join(', ') : 'None specified'}

Extract structured career details in JSON format:
{
  "roleFamily": "<e.g., Cloud & Infrastructure, Backend Engineering, Full Stack, DevOps, Data & AI, Security>",
  "level": "<e.g., Junior, Mid-Level, Senior, Staff/Principal, Lead>",
  "requiredSkills": ["<skill1>", "<skill2>", ...],
  "keywords": ["<keyword1>", "<keyword2>", ...],
  "certAliases": ["<e.g. AWS SAA, CKA, GCP PCA, Azure Developer>"]
}
Return pure JSON with no markdown wrapping.`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const raw = JSON.parse(match[0]);
        const parsed = GoalUnderstandingSchema.safeParse(raw);
        if (parsed.success) {
          return parsed.data;
        }
      }
    } catch (err) {
      console.warn('[GoalParser] Claude API call failed or timed out, using intelligent heuristic parser:', err);
    }
  }

  // Robust Heuristic Fallback
  return fallbackGoalUnderstanding(goal, userSkills);
}

export function fallbackGoalUnderstanding(goal: string, userSkills: string[] = []): GoalUnderstanding {
  const lower = goal.toLowerCase();

  let roleFamily = 'Software Engineering';
  let level = 'Senior';
  const requiredSkills: string[] = [];
  const keywords: string[] = [];
  const certAliases: string[] = [];

  // Determine Level
  if (lower.includes('staff') || lower.includes('principal')) level = 'Principal';
  else if (lower.includes('lead') || lower.includes('architect')) level = 'Lead';
  else if (lower.includes('senior') || lower.includes('sr')) level = 'Senior';
  else if (lower.includes('junior') || lower.includes('associate') || lower.includes('entry')) level = 'Junior';
  else level = 'Mid-Level';

  // Determine Role Family & Skills
  if (lower.includes('cloud') || lower.includes('devops') || lower.includes('sre') || lower.includes('infrastructure')) {
    roleFamily = 'Cloud & Infrastructure';
    requiredSkills.push('Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Observability');
    keywords.push('Cloud', 'DevOps', 'Kubernetes', 'AWS', 'Infrastructure', 'Terraform');
    certAliases.push('CKA', 'CKAD', 'AWS SAA', 'AWS DOP', 'Terraform Associate', 'GCP PCA');
  } else if (lower.includes('data') || lower.includes('ml') || lower.includes('ai') || lower.includes('analytics')) {
    roleFamily = 'Data & AI Engineering';
    requiredSkills.push('Python', 'SQL', 'Databricks', 'Snowflake', 'Apache Spark', 'Data Warehousing', 'ETL');
    keywords.push('Data Engineering', 'Spark', 'Databricks', 'Snowflake', 'Python', 'ETL');
    certAliases.push('Databricks DE', 'Snowflake SnowPro', 'AWS Data Analytics', 'GCP PDE');
  } else if (lower.includes('security') || lower.includes('cyber') || lower.includes('infosec')) {
    roleFamily = 'Security Engineering';
    requiredSkills.push('Application Security', 'Cloud Security', 'OWASP', 'IAM', 'Compliance', 'Penetration Testing');
    keywords.push('Security', 'AppSec', 'InfoSec', 'OWASP', 'IAM', 'Vulnerability Management');
    certAliases.push('CompTIA Security+', 'ISC2 CC', 'CISSP', 'AWS Security Specialty');
  } else if (lower.includes('frontend') || lower.includes('ui') || lower.includes('react') || lower.includes('web')) {
    roleFamily = 'Frontend & Web Engineering';
    requiredSkills.push('TypeScript', 'React', 'Next.js', 'State Management', 'Web Performance', 'Accessibility');
    keywords.push('Frontend', 'React', 'TypeScript', 'UI/UX', 'Performance');
    certAliases.push('Meta Front-End Developer', 'freeCodeCamp Full Stack');
  } else {
    // Default: Full Stack / Backend
    roleFamily = 'Backend & Full Stack';
    requiredSkills.push('Distributed Systems', 'System Design', 'PostgreSQL', 'Microservices', 'REST & GraphQL', 'AWS', 'Docker');
    keywords.push('Backend', 'Full Stack', 'System Design', 'APIs', 'Databases', 'Cloud');
    certAliases.push('AWS SAA', 'AWS DVA', 'CKAD', 'Meta Back-End Developer', 'Docker DCA');
  }

  // Merge extra user skills if available
  userSkills.forEach((s) => {
    if (!requiredSkills.includes(s)) requiredSkills.push(s);
  });

  return {
    roleFamily,
    level,
    requiredSkills,
    keywords,
    certAliases,
  };
}
