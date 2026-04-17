import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProgressResponse } from './types';

export async function generateProgressPDF(
  userId: string,
  progress: ProgressResponse,
  elementToPrint?: HTMLElement
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(34, 197, 94);
    pdf.text('📊 Reporte de Progreso', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Usuario: ${userId} | Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 20;

    // KPIs
    pdf.setFontSize(14);
    pdf.setTextColor(34, 197, 94);
    pdf.text('Resumen General', 20, yPosition);

    yPosition += 12;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const kpis = [
      { label: 'Sesiones Completadas:', value: progress.sessions_completed },
      { label: 'Score Promedio:', value: progress.average_score.toFixed(1) },
      {
        label: 'Score Máximo:',
        value: Math.max(...progress.latest_scores, 0),
      },
      {
        label: 'Score Mínimo:',
        value: Math.min(...progress.latest_scores, 0),
      },
    ];

    kpis.forEach((kpi) => {
      pdf.text(`${kpi.label} ${kpi.value}`, 30, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Score History Table
    if (progress.latest_scores.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Histórico de Scores', 20, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      const tableData = progress.latest_scores.map((score, idx) => [
        `Sesión ${idx + 1}`,
        score.toString(),
        `${((score / 100) * 100).toFixed(0)}%`,
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Sesión', 'Score', 'Porcentaje']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        bodyStyles: { textColor: 0 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    }

    // Focus Areas
    if (progress.focus_areas.length > 0) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(239, 68, 68);
      pdf.text('⚠️ Áreas de Mejora Prioritarias', 20, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      progress.focus_areas.forEach((area, idx) => {
        pdf.text(`${idx + 1}. ${area}`, 30, yPosition);
        yPosition += 7;
      });
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${totalPages} | AI Interview Coach - ${new Date().getFullYear()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Download
    pdf.save(`progreso_${userId}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('No se pudo generar el PDF');
  }
}

export async function captureComponentAsPDF(elementId: string, filename: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`);
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#06111f',
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      remainingHeight -= pageHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
        yPosition = 10;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error capturing component:', error);
    throw error;
  }
}
