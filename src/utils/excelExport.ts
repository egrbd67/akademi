import * as XLSX from 'xlsx';
import { ScheduleItem, TrialExam, Student } from '../types';

export const DAY_NAMES = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Distinct, vibrant color palette for subjects in Excel export
export interface SubjectColor {
  bg: string;     // Hex without #
  text: string;   // Hex without #
  border: string; // Hex without #
}

export const SUBJECT_PALETTE: Record<string, SubjectColor> = {
  'matematik': { bg: 'DCE7FE', text: '1E40AF', border: '93C5FD' }, // Soft Blue
  'geometri': { bg: 'CFFAFE', text: '0E7490', border: '67E8F9' }, // Cyan
  'fizik': { bg: 'F3E8FF', text: '6B21A8', border: 'D8B4FE' }, // Purple
  'kimya': { bg: 'FEF3C7', text: '92400E', border: 'FCD34D' }, // Amber
  'biyoloji': { bg: 'DCFCE7', text: '166534', border: '86EFAC' }, // Emerald Green
  'türkçe': { bg: 'FFE4E6', text: '9F1239', border: 'FDA4AF' }, // Rose
  'turkce': { bg: 'FFE4E6', text: '9F1239', border: 'FDA4AF' },
  'edebiyat': { bg: 'FCE7F3', text: '9D174D', border: 'F472B6' }, // Pink
  'tarih': { bg: 'FFEDD5', text: '9A3412', border: 'FDBA74' }, // Orange/Brown
  'coğrafya': { bg: 'ECFCCB', text: '3F6212', border: 'BEF264' }, // Lime
  'cografya': { bg: 'ECFCCB', text: '3F6212', border: 'BEF264' },
  'felsefe': { bg: 'E0E7FF', text: '3730A3', border: 'A5B4FC' }, // Indigo
  'din': { bg: 'CCFBF1', text: '115E59', border: '5EEAD4' }, // Teal
  'ingilizce': { bg: 'FAE8FF', text: '86198F', border: 'F0ABFC' }, // Fuchsia
  'yabancı dil': { bg: 'FAE8FF', text: '86198F', border: 'F0ABFC' },
  'paragraf': { bg: 'FEE2E2', text: '991B1B', border: 'FCA5A5' }, // Red/Coral
  'problem': { bg: 'DBEAFE', text: '1E3A8A', border: 'BFDBFE' }, // Royal Blue
  'deneme': { bg: 'FEF9C3', text: '854D0E', border: 'FDE047' }, // Yellow
  'genel tekrar': { bg: 'F1F5F9', text: '334155', border: 'CBD5E1' }, // Slate
};

export function getSubjectColor(subjectName: string): SubjectColor {
  if (!subjectName) return { bg: 'F8FAFC', text: '475569', border: 'E2E8F0' };
  const lower = subjectName.trim().toLocaleLowerCase('tr-TR');
  for (const [key, color] of Object.entries(SUBJECT_PALETTE)) {
    if (lower.includes(key)) return color;
  }
  // Deterministic fallback color for other subjects
  const hash = lower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbacks: SubjectColor[] = [
    { bg: 'E0F2FE', text: '075985', border: '7DD3FC' },
    { bg: 'EDE9FE', text: '5B21B6', border: 'C4B5FD' },
    { bg: 'FEE2E2', text: '991B1B', border: 'FCA5A5' },
    { bg: 'FEF3C7', text: '78350F', border: 'FDE68A' },
    { bg: 'D1FAE5', text: '065F46', border: '6EE7B7' },
  ];
  return fallbacks[hash % fallbacks.length];
}

/**
 * Export weekly schedule to Excel (.xlsx)
 * - 1. Sütun = Günler (Pazartesi ... Pazar)
 * - Üst Satır = 1, 2, 3... Oturumlar (Kullanıcının belirlediği aktif oturum sayısına göre)
 * - Her ders kendi özel canlı rengiyle boyanır
 * - Bütün kutucuklar renkli ve kenarlıklı
 * - A4 dikey yazdırmaya tam uyumlu (fit to page portrait, center print)
 */
export function exportScheduleToExcel(
  schedules: ScheduleItem[],
  student: Student,
  customSessionCount?: number
) {
  // Determine sessions count (defaults to user customSessionCount or at least 1, max present)
  let sessionsCount = customSessionCount && customSessionCount >= 1 ? customSessionCount : 1;
  for (let day = 1; day <= 7; day++) {
    const dayItems = schedules.filter(s => s.dayOfWeek === day);
    dayItems.forEach(item => {
      if (item.sessionNumber && item.sessionNumber > sessionsCount) {
        sessionsCount = item.sessionNumber;
      }
    });
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Prepare sheet data array: 2D array of cells for full formatting
  // Row 0: Title Banner
  // Row 1: Student info
  // Row 2: Empty
  // Row 3: Table Header ['Günler', '1. Oturum', '2. Oturum'...]
  // Rows 4-10: 7 Days
  const wsData: any[][] = [];

  wsData.push([`AKADEMİ TAKİP • HAFTALIK ÇALIŞMA PROGRAMI`]);
  wsData.push([`Öğrenci: ${student.name}   |   No: ${student.studentNumber || student.pin}   |   Sınav: ${student.targetExam || 'YKS'}   |   Tarih: ${new Date().toLocaleDateString('tr-TR')}`]);
  wsData.push([]); // blank

  // Header row
  const headerRow: string[] = ['Günler'];
  for (let s = 1; s <= sessionsCount; s++) {
    headerRow.push(`${s}. Oturum`);
  }
  wsData.push(headerRow);

  // Day rows
  const cellColorMap: Record<string, SubjectColor> = {};

  for (let day = 1; day <= 7; day++) {
    const dayItems = schedules.filter(s => s.dayOfWeek === day);
    dayItems.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

    const rowData: string[] = [DAY_NAMES[day]];

    for (let s = 1; s <= sessionsCount; s++) {
      const match = dayItems.find(item => item.sessionNumber === s) || dayItems[s - 1];
      const cellRef = XLSX.utils.encode_cell({ r: 3 + day, c: s });

      if (match) {
        let text = `${match.subject}\n${match.topic}`;
        if (match.targetValue) {
          text += `\n🎯 ${match.targetValue} ${match.targetType === 'duration' ? 'Dk' : 'Soru'}`;
        }
        if (match.timeRange && match.timeRange.trim()) {
          text += `\n⏰ ${match.timeRange.trim()}`;
        }
        rowData.push(text);
        cellColorMap[cellRef] = getSubjectColor(match.subject);
      } else {
        rowData.push('-\nBoş Oturum');
        cellColorMap[cellRef] = { bg: 'F8FAFC', text: '94A3B8', border: 'E2E8F0' };
      }
    }
    wsData.push(rowData);
  }

  // Convert array to worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths: Day column + Session columns (A4 portrait optimized)
  const colWidths = [{ wch: 15 }];
  for (let i = 1; i <= sessionsCount; i++) {
    colWidths.push({ wch: Math.max(20, Math.floor(65 / sessionsCount)) });
  }
  worksheet['!cols'] = colWidths;

  // Row heights: Title, info, header and day rows
  const rowHeights = [
    { hpt: 28 }, // Title
    { hpt: 20 }, // Student info
    { hpt: 10 }, // Blank
    { hpt: 26 }, // Header
  ];
  for (let d = 0; d < 7; d++) {
    rowHeights.push({ hpt: 55 }); // Multi-line session boxes
  }
  worksheet['!rows'] = rowHeights;

  // Merge title and info across all columns
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: sessionsCount } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: sessionsCount } },
  ];

  // A4 Portrait Print Setup & Page Centering
  worksheet['!pageSetup'] = {
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 1,
    fitToPage: true,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  // Apply rich styling to cells (supported by Excel & modern spreadsheet readers)
  // Format Title Cell (A1)
  const titleCell = worksheet['A1'];
  if (titleCell) {
    titleCell.s = {
      font: { name: 'SF Pro Display', sz: 14, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E2E8F0' } },
    };
  }

  // Format Info Cell (A2)
  const infoCell = worksheet['A2'];
  if (infoCell) {
    infoCell.s = {
      font: { name: 'SF Pro Text', sz: 10, italic: true, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'F8FAFC' } },
    };
  }

  // Format Header Row (Row 3, index 3)
  for (let c = 0; c <= sessionsCount; c++) {
    const ref = XLSX.utils.encode_cell({ r: 3, c });
    if (worksheet[ref]) {
      worksheet[ref].s = {
        font: { name: 'SF Pro Text', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E293B' } }, // Dark Slate
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } },
          left: { style: 'thin', color: { rgb: '334155' } },
          right: { style: 'thin', color: { rgb: '334155' } },
        },
      };
    }
  }

  // Format Day Cells (Column 0, Rows 4-10)
  for (let r = 4; r <= 10; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: 0 });
    if (worksheet[ref]) {
      worksheet[ref].s = {
        font: { name: 'SF Pro Text', sz: 11, bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'medium', color: { rgb: '94A3B8' } },
          right: { style: 'medium', color: { rgb: '94A3B8' } },
        },
      };
    }
  }

  // Format All Session Boxes with Subject Colors & Borders
  for (let r = 4; r <= 10; r++) {
    for (let c = 1; c <= sessionsCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const color = cellColorMap[ref] || { bg: 'FFFFFF', text: '0F172A', border: 'CBD5E1' };
      if (worksheet[ref]) {
        worksheet[ref].s = {
          font: { name: 'SF Pro Text', sz: 10, bold: true, color: { rgb: color.text } },
          fill: { fgColor: { rgb: color.bg } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: color.border } },
            bottom: { style: 'thin', color: { rgb: color.border } },
            left: { style: 'thin', color: { rgb: color.border } },
            right: { style: 'thin', color: { rgb: color.border } },
          },
        };
      }
    }
  }

  // Append sheet
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Haftalık Oturum Programı');

  // Add Detailed List Sheet
  const detailedRows = schedules.map((item, index) => ({
    'No': index + 1,
    'Öğrenci': student.name,
    'Gün': DAY_NAMES[item.dayOfWeek] || `Gün ${item.dayOfWeek}`,
    'Oturum': item.sessionNumber ? `${item.sessionNumber}. Oturum` : `${index + 1}. Ders`,
    'Saat Aralığı': item.timeRange || '(İsteğe Bağlı)',
    'Ders': item.subject,
    'Konu': item.topic,
    'Kaynak / Kitap': item.sourceBook || '-',
    'Hedef': item.targetValue ? (item.targetType === 'duration' ? `${item.targetValue} Dk` : `${item.targetValue} Soru`) : '-',
    'Durum': item.status === 'completed' ? 'Tamamlandı' : item.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor',
    'Öğretmen Notu': item.teacherNote || '',
  }));

  if (detailedRows.length > 0) {
    const detailedSheet = XLSX.utils.json_to_sheet(detailedRows);
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detaylı Oturum Listesi');
  }

  // Generate clean filename
  const safeName = student.name.replace(/\s+/g, '_');
  const filename = `${safeName}_Haftalik_Oturum_Programi_${sessionsCount}Oturum.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export trial exams & question analysis to Excel (.xlsx)
 */
export function exportTrialExamsToExcel(exams: TrialExam[], student: Student) {
  const summaryRows = exams.map((exam, index) => {
    const row: Record<string, string | number> = {
      'Sıra': index + 1,
      'Öğrenci': student.name,
      'Deneme Adı': exam.title,
      'Tarih': exam.date,
      'Sınav Türü': exam.examType,
      'Toplam Doğru': exam.totalCorrect,
      'Toplam Yanlış': exam.totalWrong,
      'Toplam Boş': exam.totalBlank,
      'Toplam Net': exam.totalNet,
    };

    exam.sections.forEach(s => {
      row[`${s.name} Net`] = s.net;
    });

    return row;
  });

  const errorRows: Array<Record<string, string | number>> = [];
  exams.forEach(exam => {
    (exam.errors || []).forEach((err, idx) => {
      errorRows.push({
        'Deneme': exam.title,
        'Tarih': exam.date,
        'Hata No': idx + 1,
        'Ders': err.subject,
        'Konu': err.topic,
        'Durum': err.status === 'wrong' ? 'Yanlış' : 'Boş',
        'Hata Nedeni': err.errorReason,
        'Öğrenci Notu': err.notes || '',
      });
    });
  });

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Deneme Netleri');

  if (errorRows.length > 0) {
    const errorSheet = XLSX.utils.json_to_sheet(errorRows);
    XLSX.utils.book_append_sheet(workbook, errorSheet, 'Hata ve Eksik Konu Analizi');
  }

  const safeName = student.name.replace(/\s+/g, '_');
  const filename = `${safeName}_Deneme_ve_Hata_Analizi.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Copy schedule as TSV format for direct paste into Google Sheets (Matrix format)
 */
export function copyScheduleForGoogleSheets(
  schedules: ScheduleItem[],
  studentName: string,
  customSessionCount?: number
): Promise<boolean> {
  let maxSessions = customSessionCount && customSessionCount >= 1 ? customSessionCount : 1;
  for (let day = 1; day <= 7; day++) {
    const dayItems = schedules.filter(s => s.dayOfWeek === day);
    dayItems.forEach(item => {
      if (item.sessionNumber && item.sessionNumber > maxSessions) {
        maxSessions = item.sessionNumber;
      }
    });
  }

  const headerRow = ['Günler'];
  for (let s = 1; s <= maxSessions; s++) {
    headerRow.push(`${s}. Oturum`);
  }

  const matrixLines: string[] = [headerRow.join('\t')];

  for (let day = 1; day <= 7; day++) {
    const dayItems = schedules.filter(s => s.dayOfWeek === day);
    dayItems.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

    const lineCols = [DAY_NAMES[day]];
    for (let sess = 1; sess <= maxSessions; sess++) {
      const match = dayItems.find(s => s.sessionNumber === sess) || dayItems[sess - 1];
      if (match) {
        let text = `${match.subject} - ${match.topic}`;
        if (match.targetValue) text += ` (${match.targetValue} ${match.targetType === 'duration' ? 'Dk' : 'Soru'})`;
        if (match.timeRange && match.timeRange.trim()) text += ` [${match.timeRange.trim()}]`;
        lineCols.push(text);
      } else {
        lineCols.push('-');
      }
    }
    matrixLines.push(lineCols.join('\t'));
  }

  const tsv = matrixLines.join('\n');
  return navigator.clipboard.writeText(tsv).then(() => true).catch(() => false);
}
