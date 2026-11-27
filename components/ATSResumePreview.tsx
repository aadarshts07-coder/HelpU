'use client';

import React, { useState } from 'react';
import { ATSResumeContent } from '@/lib/ai';
import { Download, FileText, Check, Edit2, Sparkles, Printer } from 'lucide-react';

interface ATSResumePreviewProps {
  resume: ATSResumeContent;
  onUpdateResume?: (updated: ATSResumeContent) => void;
  onRegenerateWithAI?: () => void;
  isGenerating?: boolean;
}

export default function ATSResumePreview({
  resume,
  onUpdateResume,
  onRegenerateWithAI,
  isGenerating = false,
}: ATSResumePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableResume, setEditableResume] = useState<ATSResumeContent>(resume);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  // Sync props
  React.useEffect(() => {
    setEditableResume(resume);
  }, [resume]);

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const res = await fetch('/api/resume/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableResume),
      });

      if (!res.ok) throw new Error('Failed to generate DOCX');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editableResume.fullName.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Error downloading DOCX resume');
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const saveEdits = () => {
    setIsEditing(false);
    if (onUpdateResume) {
      onUpdateResume(editableResume);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            ATS-Optimized Format
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            99% ATS Pass Rate
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerateWithAI && (
            <button
              onClick={onRegenerateWithAI}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Synthesizing...' : 'Regenerate with Claude'}
            </button>
          )}

          <button
            onClick={() => (isEditing ? saveEdits() : setIsEditing(true))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Done Editing
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                Edit Content
              </>
            )}
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={downloadingDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingDocx ? 'Generating DOCX...' : 'Export DOCX'}
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Printable / Rendered ATS Document with Paper Settle Animation */}
      <div 
        id="resume-printable-doc"
        className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg text-slate-800 font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 animate-paper-settle transition-all"
        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-300">
          {isEditing ? (
            <input
              type="text"
              value={editableResume.fullName}
              onChange={(e) => setEditableResume({ ...editableResume, fullName: e.target.value })}
              className="text-2xl font-bold text-slate-900 tracking-wide text-center w-full border border-indigo-200 rounded p-1"
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900">
              {editableResume.fullName}
            </h1>
          )}

          {isEditing ? (
            <input
              type="text"
              value={editableResume.contactLine}
              onChange={(e) => setEditableResume({ ...editableResume, contactLine: e.target.value })}
              className="text-xs text-slate-600 mt-2 text-center w-full border border-indigo-200 rounded p-1"
            />
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 tracking-normal">
              {editableResume.contactLine}
            </p>
          )}
        </div>

        {/* Professional Summary */}
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-2">
            Professional Summary
          </h2>
          {isEditing ? (
            <textarea
              rows={3}
              value={editableResume.summary}
              onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
              className="w-full text-xs text-slate-700 leading-relaxed border border-indigo-200 rounded p-2"
            />
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed">
              {editableResume.summary}
            </p>
          )}
        </div>

        {/* Technical Skills */}
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-2">
            Technical Skills & Competencies
          </h2>
          <div className="space-y-1.5 text-xs">
            {editableResume.skillsCategorized.map((cat, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-bold text-slate-900 shrink-0">{cat.category}:</span>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-2">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {editableResume.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{exp.position}</span>
                    <span className="text-slate-600"> — {exp.company} ({exp.location})</span>
                  </div>
                  <span className="font-semibold text-slate-500 text-[11px] sm:text-xs">
                    {exp.duration}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 list-disc list-outside pl-4 text-xs text-slate-700 leading-normal">
                  {exp.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        {editableResume.projects && editableResume.projects.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-2">
              Key Projects
            </h2>
            <div className="space-y-3">
              {editableResume.projects.map((proj, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-900">
                      {proj.name} {proj.technologies && <span className="font-normal italic text-slate-500">[{proj.technologies}]</span>}
                    </span>
                    {proj.link && (
                      <span className="text-[11px] text-indigo-600">{proj.link.replace('https://', '')}</span>
                    )}
                  </div>
                  <ul className="mt-1 space-y-0.5 list-disc list-outside pl-4 text-slate-700 leading-normal">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-2">
            Education
          </h2>
          <div className="space-y-2 text-xs">
            {editableResume.education.map((edu, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.field}</span>
                  <span className="text-slate-600"> — {edu.institution} {edu.grade && `(${edu.grade})`}</span>
                </div>
                <span className="font-semibold text-slate-500 text-[11px]">{edu.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications & Languages */}
        {((editableResume.certifications && editableResume.certifications.length > 0) || 
          (editableResume.languages && editableResume.languages.length > 0)) && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {editableResume.certifications && editableResume.certifications.length > 0 && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-1.5">
                  Certifications
                </h3>
                <ul className="space-y-1 list-disc pl-4 text-slate-700">
                  {editableResume.certifications.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {editableResume.languages && editableResume.languages.length > 0 && (
              <div>
                <h3 className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-800 mb-1.5">
                  Languages
                </h3>
                <p className="text-slate-700 pl-1">{editableResume.languages.join(' • ')}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
