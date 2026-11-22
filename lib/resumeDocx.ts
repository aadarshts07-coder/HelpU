import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { ATSResumeContent } from './ai';

/**
 * Builds a clean, ATS-compliant Microsoft Word (.docx) file buffer
 */
export async function generateDocxResume(resume: ATSResumeContent): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Header / Name
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: resume.fullName.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: 'Calibri',
          color: '1A1A1A',
        }),
      ],
    })
  );

  // Contact line
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: resume.contactLine,
          size: 20, // 10pt
          font: 'Calibri',
          color: '4A4A4A',
        }),
      ],
    })
  );

  const createSectionHeader = (title: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: '333333',
          space: 2,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          font: 'Calibri',
          color: '1F2937',
        }),
      ],
    });
  };

  // Professional Summary
  if (resume.summary) {
    sections.push(createSectionHeader('Professional Summary'));
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: resume.summary,
            size: 21,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Skills
  if (resume.skillsCategorized && resume.skillsCategorized.length > 0) {
    sections.push(createSectionHeader('Technical Skills & Core Competencies'));
    resume.skillsCategorized.forEach(cat => {
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${cat.category}: `,
              bold: true,
              size: 21,
              font: 'Calibri',
            }),
            new TextRun({
              text: cat.skills.join(', '),
              size: 21,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    sections.push(createSectionHeader('Professional Experience'));
    resume.experience.forEach(exp => {
      // Role & Dates
      sections.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: exp.position,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: ` — ${exp.company} (${exp.location})`,
              size: 22,
              font: 'Calibri',
              color: '374151',
            }),
            new TextRun({
              text: `\t${exp.duration}`,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '4B5563',
            }),
          ],
        })
      );

      // Bullets
      exp.bullets.forEach(bullet => {
        sections.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: bullet,
                size: 21,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    sections.push(createSectionHeader('Key Projects'));
    resume.projects.forEach(proj => {
      sections.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: proj.technologies ? ` [${proj.technologies}]` : '',
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '4B5563',
            }),
          ],
        })
      );

      proj.bullets.forEach(bullet => {
        sections.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: bullet,
                size: 21,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    sections.push(createSectionHeader('Education'));
    resume.education.forEach(edu => {
      sections.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} in ${edu.field}`,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: ` — ${edu.institution}`,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: `\t${edu.duration}`,
              size: 20,
              font: 'Calibri',
              color: '4B5563',
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: sections,
      },
    ],
  });

  const { Packer } = await import('docx');
  return await Packer.toBuffer(doc);
}
