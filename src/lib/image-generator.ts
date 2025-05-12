
import type { Report } from '@/types';

// Helper function to wrap text on canvas
function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  context.textBaseline = 'top'; // Ensure consistent baseline

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, currentY);
  return currentY + lineHeight; // Return Y position *after* this block of text
}


export async function generateReportImage(report: Report, medicalConditions?: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // --- Configuration ---
  const canvasWidth = 800;
  const padding = 40;
  const contentWidth = canvasWidth - 2 * padding;
  
  const titleFontSize = 32;
  const headerFontSize = 24;
  const regularFontSize = 16;
  const smallFontSize = 12;
  const lineHeight = 1.4;

  const primaryColor = '#3498db'; // Theme primary
  const textColor = '#2c3e50'; // Dark grey
  const mutedColor = '#7f8c8d'; // Grey
  const backgroundColor = '#f2f2f2'; // Light grey background (theme background)


  // --- Calculate dynamic height ---
  let currentY = padding;

  // Utility to measure text block height
  const measureTextBlockHeight = (text: string, fontSize: number, maxWidth: number, customLineHeight?: number) => {
    if (!text || text.trim() === "") return 0;
    ctx.font = `${fontSize}px sans-serif`;
    const words = text.split(' ');
    let line = '';
    let lines = 1;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        lines++;
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    return lines * fontSize * (customLineHeight || lineHeight);
  };
  
  // App Title
  currentY += titleFontSize * lineHeight + padding / 2;

  // Drug Name
  currentY += headerFontSize * lineHeight + padding / 2;

  // Medical Conditions (if any)
  if (medicalConditions && medicalConditions.trim() !== "") {
    currentY += headerFontSize * 0.8 * lineHeight; // Section title
    currentY += measureTextBlockHeight(medicalConditions, regularFontSize, contentWidth) + padding / 2;
  }
  
  // Components
  currentY += headerFontSize * 0.8 * lineHeight; // Section title
  if (report.components.length > 0) {
    report.components.forEach(comp => {
        currentY += measureTextBlockHeight(comp.name, regularFontSize, contentWidth, 1.2) + 4; // Smaller line height for badges
    });
  } else {
    currentY += measureTextBlockHeight("No active components listed.", regularFontSize, contentWidth);
  }
  currentY += padding / 2;

  // Side Effects
  currentY += headerFontSize * 0.8 * lineHeight; // Section title
  if (report.sideEffects.length > 0) {
     report.sideEffects.forEach(effect => {
        currentY += measureTextBlockHeight(`• ${effect}`, regularFontSize, contentWidth, 1.3) + 4;
     });
  } else {
    currentY += measureTextBlockHeight("No side effects listed.", regularFontSize, contentWidth);
  }
  currentY += padding / 2;

  // AI Summary
  currentY += headerFontSize * 0.8 * lineHeight; // Section title
  currentY += measureTextBlockHeight(report.aiSummary, regularFontSize, contentWidth) + padding / 2;

  // Footer (timestamp & disclaimer)
  currentY += smallFontSize * lineHeight * 2 + padding; // For two lines + spacing

  const canvasHeight = currentY;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // --- Drawing ---
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  currentY = padding; // Reset Y for drawing

  // App Title
  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'center';
  ctx.fillText('Chemical Imbalance Report', canvasWidth / 2, currentY + titleFontSize);
  currentY += titleFontSize * lineHeight + padding / 2;
  ctx.textAlign = 'left'; // Reset alignment

  // Drug Name
  ctx.font = `bold ${headerFontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  currentY = wrapText(ctx, report.drugName, padding, currentY, contentWidth, headerFontSize * lineHeight);
  currentY += padding / 2;

  // Medical Conditions
  if (medicalConditions && medicalConditions.trim() !== "") {
    ctx.font = `bold ${Math.round(headerFontSize * 0.8)}px sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText('Your Medical Conditions:', padding, currentY);
    currentY += Math.round(headerFontSize * 0.8) * lineHeight;
    
    ctx.font = `${regularFontSize}px sans-serif`;
    ctx.fillStyle = textColor;
    currentY = wrapText(ctx, medicalConditions, padding, currentY, contentWidth, regularFontSize * lineHeight);
    currentY += padding / 2;
  }

  // Components
  ctx.font = `bold ${Math.round(headerFontSize * 0.8)}px sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText('Active Components:', padding, currentY);
  currentY += Math.round(headerFontSize * 0.8) * lineHeight;
  
  ctx.font = `${regularFontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  if (report.components.length > 0) {
    let componentLineY = currentY;
    report.components.forEach(comp => {
      // Simple text list for components, badges are hard to draw nicely and fit
      componentLineY = wrapText(ctx, `• ${comp.name}`, padding, componentLineY, contentWidth, regularFontSize * 1.2) + 4;
    });
    currentY = componentLineY;
  } else {
    currentY = wrapText(ctx, 'No active components listed.', padding, currentY, contentWidth, regularFontSize * lineHeight);
  }
  currentY += padding / 2;

  // Side Effects
  ctx.font = `bold ${Math.round(headerFontSize * 0.8)}px sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText('Potential Side Effects / Warnings:', padding, currentY);
  currentY += Math.round(headerFontSize * 0.8) * lineHeight;

  ctx.font = `${regularFontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  if (report.sideEffects.length > 0) {
    let effectLineY = currentY;
    report.sideEffects.forEach((effect) => {
      effectLineY = wrapText(ctx, `• ${effect}`, padding, effectLineY, contentWidth, regularFontSize * 1.3) + 4;
    });
    currentY = effectLineY;
  } else {
    currentY = wrapText(ctx, 'No side effects or warnings information available.', padding, currentY, contentWidth, regularFontSize * lineHeight);
  }
  currentY += padding / 2;

  // AI Summary
  ctx.font = `bold ${Math.round(headerFontSize * 0.8)}px sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText('Personalized AI Summary:', padding, currentY);
  currentY += Math.round(headerFontSize * 0.8) * lineHeight;

  ctx.font = `${regularFontSize}px sans-serif`;
  ctx.fillStyle = textColor;
  currentY = wrapText(ctx, report.aiSummary, padding, currentY, contentWidth, regularFontSize * lineHeight);
  currentY += padding / 2;
  
  // Footer
  const reportDate = new Date(report.timestamp);
  const formattedTimestamp = `Report generated: ${reportDate.toLocaleDateString()} ${reportDate.toLocaleTimeString()}`;
  const disclaimer = "For educational purposes only. Not medical advice.";

  ctx.font = `${smallFontSize}px sans-serif`;
  ctx.fillStyle = mutedColor;
  
  // Position footer at the bottom of the calculated canvas height
  let footerY = canvasHeight - padding - (smallFontSize * lineHeight);
  ctx.fillText(disclaimer, padding, footerY);
  footerY -= smallFontSize * lineHeight;
  ctx.fillText(formattedTimestamp, padding, footerY);


  return canvas.toDataURL('image/png');
}
