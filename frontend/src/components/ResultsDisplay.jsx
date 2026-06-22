import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import SectionCard from './SectionCard'

const SECTIONS = [
  { key: 'summary', title: '1. Project Summary' },
  { key: 'features', title: '2. Features' },
  { key: 'user_stories', title: '3. User Stories' },
  { key: 'techstack', title: '4. Tech Stack' },
  { key: 'db_design', title: '5. Database Design' },
  { key: 'apis', title: '6. API Suggestions' },
  { key: 'test_cases', title: '7. Test Cases' },
  { key: 'dev_plan', title: '8. Development Plan' }
]

const ResultsDisplay = ({ project, updatedSections = [] }) => {
  const [downloading, setDownloading] = useState(false)

  if (!project?.document) return null

  const doc = project.document

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx')

      const children = []

      children.push(
        new Paragraph({
          text: 'Product Requirements Document',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: project.project_name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )

      SECTIONS.forEach(({ key, title }) => {
        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          })
        )
        const content = doc[key] || ''
        content.split('\n').forEach((line) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line || '', size: 22 })],
              spacing: { after: 120 },
            })
          )
        })
      })

      const docFile = new Document({ sections: [{ properties: {}, children }] })
      const blob = await Packer.toBlob(docFile)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.project_name.replace(/\s+/g, '_')}_PRD.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* PRD Header Row */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Generated Product Requirement Document (PRD)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', margin: 0 }}>
          {project.project_name}
        </p>
      </div>

      {/* Sections Container using SectionCard */}
      <div className="sections-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {SECTIONS.map((sec) => {
          const content = doc[sec.key];
          return (
            <SectionCard 
              key={sec.key} 
              title={sec.title} 
              content={content} 
              isUpdated={updatedSections.includes(sec.key)}
            />
          );
        })}
      </div>

      {/* Download Button Row at the bottom */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            width: 'auto',
            fontSize: '14px',
            fontWeight: '600',
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {downloading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download as DOCX</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ResultsDisplay
