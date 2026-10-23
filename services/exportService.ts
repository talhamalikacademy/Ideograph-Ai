import { ScriptData, CreatorProfile, TypographyConfig } from '../types';

/**
 * Cleanly formats a script as plain text (.txt).
 */
export const formatScriptAsText = (script: ScriptData, creator?: CreatorProfile): string => {
  const lines: string[] = [];
  const divider = '='.repeat(72);
  const subDivider = '-'.repeat(72);

  lines.push(divider);
  lines.push(`SCRIPT: ${script.title || script.topic || 'Untitled Script'}`.toUpperCase());
  lines.push(divider);
  lines.push(`Topic:           ${script.topic || 'N/A'}`);
  lines.push(`Format:          ${script.type || 'Standard Video'}`);
  lines.push(`Duration:        ${script.duration || 'N/A'}`);
  if (script.targetAudience) {
    lines.push(`Target Audience: ${script.targetAudience}`);
  }
  if (script.detectedIntent) {
    lines.push(`Intent/Goal:     ${script.detectedIntent}`);
  }
  if (creator) {
    lines.push(`Creator Style:   ${creator.name} (${creator.bio?.archetype || creator.style || 'Custom'})`);
  }
  lines.push(`Exported At:     ${new Date().toLocaleString()}`);
  lines.push(divider);
  lines.push('');

  // If user has edited the script in Canvas mode, include note or edited version
  if (script.userEditedScript) {
    lines.push('--- [CANVAS EDITED SCRIPT VERSION] ---');
    lines.push(script.userEditedScript);
    lines.push('');
    lines.push(subDivider);
    lines.push('--- [PRODUCTION SCENE BREAKDOWN] ---');
    lines.push('');
  }

  // Segments breakdown
  const segments = script.segments || [];
  if (segments.length === 0) {
    lines.push('(No scene segments found)');
  } else {
    segments.forEach((seg, idx) => {
      lines.push(`[SCENE ${idx + 1}]`);
      lines.push(`VISUAL: ${seg.visual || 'N/A'}`);
      lines.push(`AUDIO:  ${seg.audio || 'N/A'}`);
      lines.push('');
    });
  }

  // Citations / Sources
  if (script.citations && script.citations.length > 0) {
    lines.push(subDivider);
    lines.push('RESEARCH CITATIONS & SOURCES:');
    lines.push(subDivider);
    script.citations.forEach((c, idx) => {
      lines.push(`${idx + 1}. [${c.type || 'Source'}] ${c.sourceName}`);
      if (c.context) lines.push(`   Context: ${c.context}`);
      if (c.isVerified && c.url) lines.push(`   Verified Link: ${c.url}`);
      if (c.reliabilityScore) lines.push(`   Reliability: ${c.reliabilityScore}`);
      lines.push('');
    });
  }

  // Calls to Action
  if (script.ctas && script.ctas.length > 0) {
    lines.push(subDivider);
    lines.push('CALLS TO ACTION (CTAs):');
    lines.push(subDivider);
    script.ctas.forEach((cta, idx) => {
      lines.push(`- Option ${idx + 1}: ${cta}`);
    });
    lines.push('');
  }

  return lines.join('\n');
};

/**
 * Formats a script as structured Markdown (.md).
 */
export const formatScriptAsMarkdown = (script: ScriptData, creator?: CreatorProfile): string => {
  const lines: string[] = [];

  lines.push(`# ${script.title || script.topic || 'Untitled Script'}`);
  lines.push('');
  lines.push(`> **Topic:** ${script.topic || 'N/A'}  `);
  lines.push(`> **Format:** ${script.type || 'Standard Video'} | **Duration:** ${script.duration || 'N/A'}  `);
  if (creator) {
    lines.push(`> **Creator Style:** ${creator.name} (${creator.bio?.archetype || creator.style || 'Custom'})  `);
  }
  if (script.targetAudience) {
    lines.push(`> **Target Audience:** ${script.targetAudience}  `);
  }
  if (script.detectedIntent) {
    lines.push(`> **Intent:** ${script.detectedIntent}  `);
  }
  lines.push(`> *Generated on ${new Date().toLocaleDateString()}*`);
  lines.push('');

  if (script.userEditedScript) {
    lines.push('## Canvas Edited Draft');
    lines.push('');
    lines.push(script.userEditedScript);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## Production Breakdown');
  lines.push('');
  lines.push('| Scene # | Visual Direction | Audio / Voiceover |');
  lines.push('|:---:|---|---|');

  const segments = script.segments || [];
  segments.forEach((seg, idx) => {
    const cleanVisual = (seg.visual || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const cleanAudio = (seg.audio || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| **${idx + 1}** | ${cleanVisual} | ${cleanAudio} |`);
  });
  lines.push('');

  // Citations
  if (script.citations && script.citations.length > 0) {
    lines.push('## Evidence & Sources');
    lines.push('');
    script.citations.forEach((c) => {
      const link = c.isVerified && c.url ? ` - [Verified Source](${c.url})` : ' *(Unverified reference)*';
      lines.push(`- **${c.sourceName}** (${c.type}): ${c.context}${link}`);
    });
    lines.push('');
  }

  // CTAs
  if (script.ctas && script.ctas.length > 0) {
    lines.push('## Call to Action Options');
    lines.push('');
    script.ctas.forEach((cta, idx) => {
      lines.push(`${idx + 1}. ${cta}`);
    });
    lines.push('');
  }

  return lines.join('\n');
};

/**
 * Formats script as clean narration-only text (ideal for teleprompters & VO talent).
 */
export const formatNarrationOnly = (script: ScriptData): string => {
  const segments = script.segments || [];
  if (script.userEditedScript && segments.length === 0) {
    return script.userEditedScript;
  }
  return segments
    .map(seg => seg.audio?.trim())
    .filter(Boolean)
    .join('\n\n');
};

/**
 * Triggers a browser download for a text-based file.
 */
export const downloadTextFile = (content: string, filename: string, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Sanitizes text to safely escape HTML entities.
 */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Exports the script as a high-fidelity PDF by rendering a print document
 * in an isolated iframe with dedicated print media stylesheets.
 */
export const exportScriptAsPdf = (
  script: ScriptData,
  creator?: CreatorProfile,
  typography?: TypographyConfig
) => {
  const segments = script.segments || [];
  const title = script.title || script.topic || 'Video Script';
  const creatorName = creator?.name || script.selectedCreatorName || 'Studio Creator';
  const creatorArchetype = creator?.bio?.archetype || creator?.style || 'Standard Voice';

  const fontFamily = typography?.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const fontSize = typography?.fontSize || '15px';
  const lineHeight = typography?.lineHeight || '1.6';

  const scenesHtml = segments.map((seg, idx) => `
    <tr class="scene-row">
      <td class="scene-num">${idx + 1}</td>
      <td class="scene-visual">
        <div class="visual-label">VISUAL DIRECTION</div>
        <div class="visual-text">${escapeHtml(seg.visual || '')}</div>
      </td>
      <td class="scene-audio">
        <div class="audio-label">VOICEOVER / AUDIO</div>
        <div class="audio-text" style="font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight};">${escapeHtml(seg.audio || '')}</div>
      </td>
    </tr>
  `).join('');

  const citationsHtml = script.citations && script.citations.length > 0 ? `
    <div class="citations-section">
      <div class="section-title">Research &amp; Verified Sources</div>
      <div class="citations-grid">
        ${script.citations.map((c, i) => `
          <div class="citation-card">
            <span class="citation-index">${i + 1}</span>
            <div class="citation-body">
              <div class="citation-header">
                <strong>${escapeHtml(c.sourceName)}</strong>
                <span class="citation-badge">${escapeHtml(c.type || 'Source')}</span>
              </div>
              <p class="citation-context">${escapeHtml(c.context || '')}</p>
              ${c.isVerified && c.url ? `<a class="citation-link" href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const ctasHtml = script.ctas && script.ctas.length > 0 ? `
    <div class="cta-section">
      <div class="section-title">Call To Action Options</div>
      <ul>
        ${script.ctas.map(cta => `<li>${escapeHtml(cta)}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)} - Script</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 32px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        @page {
          size: A4;
          margin: 16mm 14mm 16mm 14mm;
        }

        @media print {
          body {
            padding: 0;
            background: #ffffff;
            color: #000000;
          }
          .no-print {
            display: none !important;
          }
          .scene-row {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .citations-section, .cta-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }

        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .title-block h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .meta-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #475569;
        }

        .meta-chips span strong {
          color: #0f172a;
        }

        .creator-block {
          text-align: right;
          font-size: 12px;
          color: #475569;
        }

        .creator-block .name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .creator-block .archetype {
          color: #6366f1;
          font-weight: 600;
        }

        /* Script Table */
        .script-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }

        .script-table th {
          background-color: #f8fafc;
          border-bottom: 2px solid #cbd5e1;
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }

        .scene-row {
          border-bottom: 1px solid #e2e8f0;
        }

        .scene-num {
          width: 44px;
          vertical-align: top;
          padding: 14px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-align: center;
          background-color: #f8fafc;
          border-right: 1px solid #e2e8f0;
        }

        .scene-visual {
          width: 44%;
          vertical-align: top;
          padding: 14px 16px;
          background-color: #fafbfc;
          border-right: 1px solid #e2e8f0;
        }

        .visual-label, .audio-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .visual-text {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
          font-style: italic;
        }

        .scene-audio {
          width: 52%;
          vertical-align: top;
          padding: 14px 16px;
          background-color: #ffffff;
        }

        .audio-text {
          color: #0f172a;
          white-space: pre-wrap;
        }

        /* Section Title */
        .section-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0f172a;
          margin-bottom: 12px;
          border-left: 3px solid #6366f1;
          padding-left: 8px;
        }

        /* Citations */
        .citations-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .citations-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .citation-card {
          display: flex;
          gap: 12px;
          background: #f8fafc;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .citation-index {
          font-weight: 700;
          color: #6366f1;
        }

        .citation-header {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 2px;
        }

        .citation-badge {
          font-size: 10px;
          background: #e0e7ff;
          color: #3730a3;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .citation-context {
          color: #475569;
          margin-top: 2px;
        }

        .citation-link {
          color: #2563eb;
          text-decoration: none;
          font-size: 11px;
          word-break: break-all;
        }

        /* CTA */
        .cta-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .cta-section ul {
          padding-left: 20px;
          font-size: 13px;
          color: #334155;
        }

        .cta-section li {
          margin-bottom: 4px;
        }

        /* Footer */
        .footer {
          margin-top: 36px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-block">
          <h1>${escapeHtml(title)}</h1>
          <div class="meta-chips">
            <span><strong>Format:</strong> ${escapeHtml(script.type || 'Video')}</span>
            <span>·</span>
            <span><strong>Duration:</strong> ${escapeHtml(script.duration || 'Standard')}</span>
            ${script.targetAudience ? `<span>·</span><span><strong>Audience:</strong> ${escapeHtml(script.targetAudience)}</span>` : ''}
            ${script.detectedIntent ? `<span>·</span><span><strong>Goal:</strong> ${escapeHtml(script.detectedIntent)}</span>` : ''}
          </div>
        </div>
        <div class="creator-block">
          <div class="name">${escapeHtml(creatorName)}</div>
          <div class="archetype">${escapeHtml(creatorArchetype)}</div>
          <div>${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <table class="script-table">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">#</th>
            <th style="width: 44%;">Visual Scene Direction</th>
            <th style="width: 52%;">Spoken Narration &amp; Audio</th>
          </tr>
        </thead>
        <tbody>
          ${scenesHtml}
        </tbody>
      </table>

      ${citationsHtml}
      ${ctasHtml}

      <div class="footer">
        <span>Generated with Script Creator Studio</span>
        <span>Page 1 / Printed Document</span>
      </div>
    </body>
    </html>
  `;

  // Create isolated offscreen iframe for printing to avoid interfering with current DOM state
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(printDocumentHtml);
  doc.close();

  // Wait for resources/styles to settle inside the iframe then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print execution failed:', e);
    } finally {
      // Clean up after print dialogue closes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
};

/**
 * Exports script as a Microsoft Word-compatible (.docx / .doc) document.
 */
export const exportScriptAsDocx = (script: ScriptData, creator?: CreatorProfile) => {
  const title = script.title || script.topic || 'Video Script';
  const creatorName = creator?.name || script.selectedCreatorName || 'Studio Creator';
  const segments = script.segments || [];

  const tableRows = segments.map((seg, idx) => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; width: 50px; text-align: center; vertical-align: top;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 10px; width: 45%; vertical-align: top; color: #334155;"><em>${escapeHtml(seg.visual || '')}</em></td>
      <td style="border: 1px solid #cbd5e1; padding: 10px; width: 50%; vertical-align: top; color: #0f172a;">${escapeHtml(seg.audio || '')}</td>
    </tr>
  `).join('');

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #0f172a; }
        h1 { font-size: 18pt; color: #0f172a; margin-bottom: 6pt; }
        .meta { color: #64748b; font-size: 10pt; margin-bottom: 16pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 14pt; }
        th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <strong>Creator Style:</strong> ${escapeHtml(creatorName)} | 
        <strong>Duration:</strong> ${escapeHtml(script.duration || 'N/A')} | 
        <strong>Format:</strong> ${escapeHtml(script.type || 'Video')}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">#</th>
            <th style="width: 45%;">Visual Direction</th>
            <th style="width: 50%;">Spoken Audio Narration</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const sanitizedTitle = (script.title || script.topic || 'script').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadTextFile(wordHtml, `${sanitizedTitle}.doc`, 'application/msword;charset=utf-8');
};

/**
 * Exports the complete script package as formatted JSON (.json).
 */
export const exportScriptAsJson = (script: ScriptData) => {
  const jsonContent = JSON.stringify(script, null, 2);
  const sanitizedTitle = (script.title || script.topic || 'script').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadTextFile(jsonContent, `${sanitizedTitle}.json`, 'application/json;charset=utf-8');
};

