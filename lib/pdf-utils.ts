/**
 * PDF Generation Utility for CVisionAI
 * Creates properly formatted PDFs with brand styling matching the UI
 * Supports multiple pages with proper page breaks
 */

// Brand colors from globals.css (RGB values)
const COLORS = {
  primary: [65, 101, 213], // #4165D5
  secondary: [241, 172, 32], // #F1AC20
  accent: [195, 232, 201], // #C3E8C9
  darkBlue: [41, 56, 85], // #293855
  success: [195, 232, 201], // #C3E8C9
  error: [239, 68, 68], // #EF4444
  foreground: [41, 56, 85], // #293855
  background: [255, 255, 255], // White
} as const

export interface PDFSection {
  title: string
  content: string[]
  type?: 'header' | 'section' | 'subsection' | 'list' | 'paragraph'
  priority?: 'high' | 'medium' | 'low'
  category?: string
}

export interface PDFMetadata {
  title: string
  subtitle?: string
  generatedAt: Date
  footer?: string
}

interface PageContent {
  content: string
  pageNumber: number
}

/**
 * Escape text for PDF content stream
 */
function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
}

/**
 * Convert RGB array to PDF color format
 */
function rgbToPdfColor(rgb: readonly [number, number, number]): string {
  return `${rgb[0] / 255} ${rgb[1] / 255} ${rgb[2] / 255}`
}

/**
 * Create page header (for pages after the first)
 */
function createPageHeader(metadata: PDFMetadata, pageNumber: number): string {
  let header = ''
  const yPosition = 750
  
  // Header bar
  header += `q\n`
  header += `${rgbToPdfColor(COLORS.primary)} rg\n`
  header += `0 ${yPosition} 612 30 re\n`
  header += `f\n`
  header += `Q\n`
  
  // Title
  header += `BT\n`
  header += `/F2 14 Tf\n`
  header += `${rgbToPdfColor(COLORS.background)} rg\n`
  header += `50 ${yPosition - 8} Td\n`
  header += `(${escapePdfText(metadata.title)}) Tj\n`
  header += `ET\n`
  
  // Page number
  header += `BT\n`
  header += `/F1 10 Tf\n`
  header += `${rgbToPdfColor(COLORS.background)} rg\n`
  header += `500 ${yPosition - 8} Td\n`
  header += `(${escapePdfText(`Page ${pageNumber}`)}) Tj\n`
  header += `ET\n`
  
  return header
}

/**
 * Create page footer
 */
function createPageFooter(metadata: PDFMetadata): string {
  let footer = ''
  const yPosition = 40
  
  // Footer divider
  footer += `q\n`
  footer += `${rgbToPdfColor(COLORS.primary)} rg\n`
  footer += `50 ${yPosition - 5} 512 1 re\n`
  footer += `f\n`
  footer += `Q\n`
  
  // Footer text
  if (metadata.footer) {
    footer += `BT\n`
    footer += `/F1 8 Tf\n`
    footer += `${rgbToPdfColor(COLORS.darkBlue)} rg\n`
    footer += `50 ${yPosition - 15} Td\n`
    footer += `(${escapePdfText(metadata.footer)}) Tj\n`
    footer += `ET\n`
  }
  
  return footer
}

/**
 * Create a properly formatted PDF document with brand styling and multi-page support
 */
export function createPdfBlob(sections: PDFSection[], metadata: PDFMetadata): Blob {
  const pages: PageContent[] = []
  let currentPageContent = ''
  let yPosition = 750
  let pageNumber = 1
  const BOTTOM_MARGIN = 80 // Space reserved for footer
  
  // Helper function to start a new page
  const startNewPage = () => {
    // Save current page if it has content
    if (currentPageContent.trim()) {
      pages.push({ content: currentPageContent, pageNumber })
    }
    
    // Start new page
    pageNumber++
    currentPageContent = ''
    yPosition = 750
    
    // Add page header (except for first page which has full header)
    if (pageNumber > 2) {
      currentPageContent += createPageHeader(metadata, pageNumber - 1)
      yPosition -= 40
    }
  }
  
  // First page header
  currentPageContent += `q\n`
  currentPageContent += `${rgbToPdfColor(COLORS.primary)} rg\n`
  currentPageContent += `0 ${yPosition} 612 45 re\n`
  currentPageContent += `f\n`
  currentPageContent += `Q\n`
  
  yPosition -= 25
  
  // Title
  currentPageContent += `BT\n`
  currentPageContent += `/F2 22 Tf\n`
  currentPageContent += `${rgbToPdfColor(COLORS.background)} rg\n`
  currentPageContent += `50 ${yPosition} Td\n`
  currentPageContent += `(${escapePdfText(metadata.title)}) Tj\n`
  currentPageContent += `ET\n`
  
  yPosition -= 25

  // Subtitle if present
  if (metadata.subtitle) {
    currentPageContent += `BT\n`
    currentPageContent += `/F1 12 Tf\n`
    currentPageContent += `${rgbToPdfColor(COLORS.foreground)} rg\n`
    currentPageContent += `50 ${yPosition} Td\n`
    currentPageContent += `(${escapePdfText(metadata.subtitle)}) Tj\n`
    currentPageContent += `ET\n`
    yPosition -= 20
  }

  // Generated date
  currentPageContent += `BT\n`
  currentPageContent += `/F1 10 Tf\n`
  currentPageContent += `${rgbToPdfColor(COLORS.darkBlue)} rg\n`
  currentPageContent += `50 ${yPosition} Td\n`
  const dateStr = `Generated: ${metadata.generatedAt.toLocaleDateString()} at ${metadata.generatedAt.toLocaleTimeString()}`
  currentPageContent += `(${escapePdfText(dateStr)}) Tj\n`
  currentPageContent += `ET\n`
  
  yPosition -= 25

  // Divider line
  currentPageContent += `q\n`
  currentPageContent += `${rgbToPdfColor(COLORS.secondary)} rg\n`
  currentPageContent += `50 ${yPosition} 512 2 re\n`
  currentPageContent += `f\n`
  currentPageContent += `Q\n`
  
  yPosition -= 20

  // Process sections
  for (const section of sections) {
    const sectionType = section.type || 'section'
    
    // Check if we need a new page before adding section
    const estimatedHeight = sectionType === 'header' ? 50 : 
                           sectionType === 'section' ? 40 : 
                           sectionType === 'subsection' ? 60 : 30
    
    if (yPosition - estimatedHeight < BOTTOM_MARGIN) {
      // Add footer to current page
      currentPageContent += createPageFooter(metadata)
      startNewPage()
    }

    if (sectionType === 'header') {
      // Main header with primary color background
      currentPageContent += `q\n`
      currentPageContent += `${rgbToPdfColor(COLORS.primary)} rg\n`
      currentPageContent += `50 ${yPosition - 5} 512 28 re\n`
      currentPageContent += `f\n`
      currentPageContent += `Q\n`
      
      currentPageContent += `BT\n`
      currentPageContent += `/F2 18 Tf\n`
      currentPageContent += `${rgbToPdfColor(COLORS.background)} rg\n`
      currentPageContent += `55 ${yPosition} Td\n`
      currentPageContent += `(${escapePdfText(section.title)}) Tj\n`
      currentPageContent += `ET\n`
      yPosition -= 35
    } else if (sectionType === 'section') {
      // Section header with primary color text
      currentPageContent += `BT\n`
      currentPageContent += `/F2 16 Tf\n`
      currentPageContent += `${rgbToPdfColor(COLORS.primary)} rg\n`
      currentPageContent += `50 ${yPosition} Td\n`
      currentPageContent += `(${escapePdfText(section.title)}) Tj\n`
      currentPageContent += `ET\n`
      yPosition -= 22
      
      // Underline with secondary color
      currentPageContent += `q\n`
      currentPageContent += `${rgbToPdfColor(COLORS.secondary)} rg\n`
      currentPageContent += `50 ${yPosition + 2} 250 2 re\n`
      currentPageContent += `f\n`
      currentPageContent += `Q\n`
      yPosition -= 12
    } else if (sectionType === 'subsection') {
      // Subsection header - for feedback items, add left border effect
      if (section.priority) {
        // Draw left border with priority color
        const priorityColors = {
          high: COLORS.error,
          medium: COLORS.secondary,
          low: COLORS.primary,
        }
        const priorityColor = priorityColors[section.priority]
        
        currentPageContent += `q\n`
        currentPageContent += `${rgbToPdfColor(priorityColor)} rg\n`
        currentPageContent += `50 ${yPosition - 5} 4 30 re\n`
        currentPageContent += `f\n`
        currentPageContent += `Q\n`
        
        // Background tint for feedback items
        const bgColors = {
          high: [COLORS.error[0] / 20, COLORS.error[1] / 20, COLORS.error[2] / 20],
          medium: [COLORS.secondary[0] / 20, COLORS.secondary[1] / 20, COLORS.secondary[2] / 20],
          low: [COLORS.primary[0] / 20, COLORS.primary[1] / 20, COLORS.primary[2] / 20],
        }
        const bgColor = bgColors[section.priority]
        currentPageContent += `q\n`
        currentPageContent += `${bgColor[0]} ${bgColor[1]} ${bgColor[2]} rg\n`
        currentPageContent += `54 ${yPosition - 5} 508 30 re\n`
        currentPageContent += `f\n`
        currentPageContent += `Q\n`
      }
      
      // Title
      currentPageContent += `BT\n`
      currentPageContent += `/F2 12 Tf\n`
      currentPageContent += `${rgbToPdfColor(COLORS.darkBlue)} rg\n`
      currentPageContent += `58 ${yPosition} Td\n`
      currentPageContent += `(${escapePdfText(section.title)}) Tj\n`
      currentPageContent += `ET\n`
      
      // Priority badge
      if (section.priority) {
        const priorityColors = {
          high: COLORS.error,
          medium: COLORS.secondary,
          low: COLORS.primary,
        }
        const priorityColor = priorityColors[section.priority]
        const priorityText = section.priority.toUpperCase()
        const badgeWidth = priorityText === 'HIGH' ? 42 : priorityText === 'MEDIUM' ? 48 : 38
        const badgeX = 512 - badgeWidth - 10
        
        currentPageContent += `q\n`
        currentPageContent += `${rgbToPdfColor(priorityColor)} rg\n`
        currentPageContent += `${badgeX} ${yPosition + 2} ${badgeWidth} 12 re\n`
        currentPageContent += `f\n`
        currentPageContent += `Q\n`
        
        currentPageContent += `BT\n`
        currentPageContent += `/F1 7 Tf\n`
        currentPageContent += `${rgbToPdfColor(COLORS.background)} rg\n`
        currentPageContent += `${badgeX + 3} ${yPosition + 5} Td\n`
        currentPageContent += `(${escapePdfText(priorityText)}) Tj\n`
        currentPageContent += `ET\n`
      }
      
      // Category badge
      if (section.category) {
        currentPageContent += `BT\n`
        currentPageContent += `/F1 9 Tf\n`
        currentPageContent += `${rgbToPdfColor(COLORS.primary)} rg\n`
        currentPageContent += `58 ${yPosition - 12} Td\n`
        currentPageContent += `(${escapePdfText(section.category)}) Tj\n`
        currentPageContent += `ET\n`
      }
      
      yPosition -= 25
    }

    // Content lines
    for (const line of section.content) {
      // Check if we need a new page
      if (yPosition < BOTTOM_MARGIN) {
        currentPageContent += createPageFooter(metadata)
        startNewPage()
      }

      if (line.trim() === '') {
        yPosition -= 8
        continue
      }

      const indentX = (sectionType === 'subsection' && section.priority) ? 58 : 50

      // Check if it's a list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const listContent = line.trim().substring(2)
        currentPageContent += `BT\n`
        currentPageContent += `/F2 10 Tf\n`
        currentPageContent += `${rgbToPdfColor(COLORS.primary)} rg\n`
        currentPageContent += `${indentX + 5} ${yPosition} Td\n`
        currentPageContent += `(${escapePdfText('•')}) Tj\n`
        currentPageContent += `ET\n`
        
        currentPageContent += `BT\n`
        currentPageContent += `/F1 10 Tf\n`
        currentPageContent += `${rgbToPdfColor(COLORS.foreground)} rg\n`
        currentPageContent += `${indentX + 15} ${yPosition} Td\n`
        currentPageContent += `(${escapePdfText(listContent)}) Tj\n`
        currentPageContent += `ET\n`
        yPosition -= 14
      } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        // Bold text
        const boldText = line.trim().replace(/\*\*/g, '')
        currentPageContent += `BT\n`
        currentPageContent += `/F2 11 Tf\n`
        currentPageContent += `${rgbToPdfColor(COLORS.darkBlue)} rg\n`
        currentPageContent += `${indentX} ${yPosition} Td\n`
        currentPageContent += `(${escapePdfText(boldText)}) Tj\n`
        currentPageContent += `ET\n`
        yPosition -= 16
      } else {
        // Regular paragraph text with word wrapping
        const fontSize = (sectionType === 'subsection' && section.priority) ? 9.5 : 10
        const words = line.split(' ')
        let currentLine = ''
        const maxChars = 78
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          if (testLine.length <= maxChars) {
            currentLine = testLine
          } else {
            if (currentLine) {
              // Check if we need new page before adding line
              if (yPosition < BOTTOM_MARGIN) {
                currentPageContent += createPageFooter(metadata)
                startNewPage()
              }
              
              currentPageContent += `BT\n`
              currentPageContent += `/F1 ${fontSize} Tf\n`
              currentPageContent += `${rgbToPdfColor(COLORS.foreground)} rg\n`
              currentPageContent += `${indentX} ${yPosition} Td\n`
              currentPageContent += `(${escapePdfText(currentLine)}) Tj\n`
              currentPageContent += `ET\n`
              yPosition -= 13
            }
            currentLine = word
          }
        }
        
        if (currentLine) {
          if (yPosition < BOTTOM_MARGIN) {
            currentPageContent += createPageFooter(metadata)
            startNewPage()
          }
          
          currentPageContent += `BT\n`
          currentPageContent += `/F1 ${fontSize} Tf\n`
          currentPageContent += `${rgbToPdfColor(COLORS.foreground)} rg\n`
          currentPageContent += `${indentX} ${yPosition} Td\n`
          currentPageContent += `(${escapePdfText(currentLine)}) Tj\n`
          currentPageContent += `ET\n`
          yPosition -= 13
        }
      }
    }

    yPosition -= (sectionType === 'subsection' && section.priority) ? 12 : 8
  }

  // Add footer to last page
  currentPageContent += createPageFooter(metadata)
  pages.push({ content: currentPageContent, pageNumber })

  // Build PDF structure
  const pdfLines: string[] = []
  pdfLines.push('%PDF-1.4')
  
  let objectCounter = 1
  const objectOffsets: number[] = []
  
  // Catalog object
  objectOffsets.push(pdfLines.join('\n').length)
  pdfLines.push(`${objectCounter++} 0 obj`)
  pdfLines.push('<< /Type /Catalog /Pages 2 0 R >>')
  pdfLines.push('endobj')
  
  // Pages object - will reference all page objects
  const pagesObjNum = objectCounter++
  const pageObjectNums: number[] = []
  const contentStreamNums: number[] = []
  
  // Create page objects and content streams
  for (let i = 0; i < pages.length; i++) {
    const pageObjNum = objectCounter++
    const contentStreamNum = objectCounter++
    pageObjectNums.push(pageObjNum)
    contentStreamNums.push(contentStreamNum)
  }
  
  // Font object numbers (created after pages)
  const font1Num = objectCounter++
  const font2Num = objectCounter++
  
  // Write Pages object
  const pageRefs = pageObjectNums.map(n => `${n} 0 R`).join(' ')
  objectOffsets.push(pdfLines.join('\n').length)
  pdfLines.push(`${pagesObjNum} 0 obj`)
  pdfLines.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`)
  pdfLines.push('endobj')
  
  // Write page objects and content streams
  for (let i = 0; i < pages.length; i++) {
    // Page object
    objectOffsets.push(pdfLines.join('\n').length)
    pdfLines.push(`${pageObjectNums[i]} 0 obj`)
    pdfLines.push(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${contentStreamNums[i]} 0 R /Resources << /Font << /F1 ${font1Num} 0 R /F2 ${font2Num} 0 R >> >> >>`)
    pdfLines.push('endobj')
    
    // Content stream
    objectOffsets.push(pdfLines.join('\n').length)
    pdfLines.push(`${contentStreamNums[i]} 0 obj`)
    pdfLines.push(`<< /Length ${pages[i].content.length} >>`)
    pdfLines.push('stream')
    pdfLines.push(pages[i].content)
    pdfLines.push('endstream')
    pdfLines.push('endobj')
  }
  
  // Font objects
  objectOffsets.push(pdfLines.join('\n').length)
  pdfLines.push(`${font1Num} 0 obj`)
  pdfLines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  pdfLines.push('endobj')
  
  objectOffsets.push(pdfLines.join('\n').length)
  pdfLines.push(`${font2Num} 0 obj`)
  pdfLines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  pdfLines.push('endobj')
  
  // Cross-reference table
  const xrefStart = pdfLines.join('\n').length
  pdfLines.push('xref')
  pdfLines.push(`0 ${objectCounter}`)
  pdfLines.push('0000000000 65535 f ')
  
  for (let i = 1; i < objectCounter; i++) {
    const offset = objectOffsets[i - 1] || 0
    pdfLines.push(`${String(offset).padStart(10, '0')} 00000 n `)
  }
  
  // Trailer
  pdfLines.push('trailer')
  pdfLines.push(`<< /Size ${objectCounter} /Root 1 0 R >>`)
  pdfLines.push('startxref')
  pdfLines.push(String(xrefStart))
  pdfLines.push('%%EOF')

  const pdfContent = pdfLines.join('\n')
  return new Blob([pdfContent], { type: 'application/pdf' })
}

/**
 * Helper to download PDF
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Create sections from analysis data for PDF export
 */
export function createAnalysisSections(
  resumeData: {
    skills: string[]
    experience: Array<{ company: string; role: string; duration?: string; description?: string }>
    education: Array<{ school: string; degree: string; year?: string }>
    summary?: string
  },
  analysis?: {
    strengths?: Array<{ title: string; description: string; confidence?: number; tags?: string[] }>
    weaknesses?: Array<{ title: string; description: string; confidence?: number; tags?: string[] }>
    improvements?: Array<{ title: string; description: string; confidence?: number; tags?: string[] }>
    summary?: string
  }
): PDFSection[] {
  const sections: PDFSection[] = []

  // Resume Overview Header
  sections.push({
    title: 'Resume Overview',
    type: 'section',
    content: [],
  })

  // Skills
  sections.push({
    title: 'Skills & Competencies',
    type: 'subsection',
    content: resumeData.skills.length > 0
      ? resumeData.skills.map(skill => `- ${skill}`)
      : ['- No skills listed'],
  })

  // Experience
  const experienceContent: string[] = []
  if (resumeData.experience.length > 0) {
    resumeData.experience.forEach(exp => {
      experienceContent.push(`**${exp.role}** at ${exp.company}`)
      if (exp.duration) experienceContent.push(`  Duration: ${exp.duration}`)
      if (exp.description) experienceContent.push(`  ${exp.description}`)
      experienceContent.push('')
    })
  } else {
    experienceContent.push('- No experience listed')
  }
  sections.push({
    title: 'Professional Experience',
    type: 'subsection',
    content: experienceContent,
  })

  // Education
  const educationContent: string[] = []
  if (resumeData.education.length > 0) {
    resumeData.education.forEach(edu => {
      educationContent.push(`- ${edu.degree} from ${edu.school}${edu.year ? ` (${edu.year})` : ''}`)
    })
  } else {
    educationContent.push('- No education listed')
  }
  sections.push({
    title: 'Education',
    type: 'subsection',
    content: educationContent,
  })

  // Summary
  if (resumeData.summary) {
    sections.push({
      title: 'Professional Summary',
      type: 'subsection',
      content: [resumeData.summary],
    })
  }

  // AI Analysis
  if (analysis) {
    sections.push({
      title: 'AI-Powered Analysis & Insights',
      type: 'header',
      content: [],
    })

    if (analysis.summary) {
      sections.push({
        title: 'Executive Summary',
        type: 'subsection',
        content: [analysis.summary],
      })
    }

    // Strengths
    if (analysis.strengths && analysis.strengths.length > 0) {
      const strengthsContent: string[] = []
      analysis.strengths.forEach((insight, index) => {
        strengthsContent.push(`**${index + 1}. ${insight.title}**`)
        strengthsContent.push(insight.description)
        if (insight.tags && insight.tags.length > 0) {
          strengthsContent.push(`Related Areas: ${insight.tags.join(', ')}`)
        }
        if (typeof insight.confidence === 'number') {
          strengthsContent.push(`Confidence Level: ${insight.confidence}%`)
        }
        strengthsContent.push('')
      })
      sections.push({
        title: 'Top Strengths',
        type: 'section',
        content: strengthsContent,
      })
    }

    // Weaknesses
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      const weaknessesContent: string[] = []
      analysis.weaknesses.forEach((insight, index) => {
        weaknessesContent.push(`**${index + 1}. ${insight.title}**`)
        weaknessesContent.push(insight.description)
        if (insight.tags && insight.tags.length > 0) {
          weaknessesContent.push(`Related Areas: ${insight.tags.join(', ')}`)
        }
        if (typeof insight.confidence === 'number') {
          weaknessesContent.push(`Confidence Level: ${insight.confidence}%`)
        }
        weaknessesContent.push('')
      })
      sections.push({
        title: 'Potential Gaps & Areas for Development',
        type: 'section',
        content: weaknessesContent,
      })
    }

    // Improvements
    if (analysis.improvements && analysis.improvements.length > 0) {
      const improvementsContent: string[] = []
      analysis.improvements.forEach((insight, index) => {
        improvementsContent.push(`**${index + 1}. ${insight.title}**`)
        improvementsContent.push(insight.description)
        if (insight.tags && insight.tags.length > 0) {
          improvementsContent.push(`Related Areas: ${insight.tags.join(', ')}`)
        }
        if (typeof insight.confidence === 'number') {
          improvementsContent.push(`Confidence Level: ${insight.confidence}%`)
        }
        improvementsContent.push('')
      })
      sections.push({
        title: 'Improvement Opportunities',
        type: 'section',
        content: improvementsContent,
      })
    }
  }

  return sections
}

/**
 * Create sections from feedback data for PDF export
 * Matches the UI layout with numbered items, priority badges, and category grouping
 */
export function createFeedbackSections(
  feedbackItems: Array<{
    id: string
    category: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }>
): PDFSection[] {
  const sections: PDFSection[] = []

  // Group by category
  const groupedByCategory = feedbackItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof feedbackItems>)

  // Track global item number across all categories
  let globalItemNumber = 1

  Object.entries(groupedByCategory).forEach(([category, items]) => {
    // Category header section
    sections.push({
      title: category,
      type: 'section',
      category,
      content: [],
    })

    // Add each item in this category
    items.forEach((item) => {
      sections.push({
        title: `${globalItemNumber}. ${item.title}`,
        type: 'subsection',
        priority: item.priority,
        category: item.category,
        content: [item.description],
      })
      globalItemNumber++
    })
  })

  return sections
}
