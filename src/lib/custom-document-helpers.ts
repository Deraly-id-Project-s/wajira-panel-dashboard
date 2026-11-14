import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import type { ComponentPosition } from '@/components/features/document-template/CustomableReportDocumentDialog';

export const DEFAULT_CANVAS_POSITIONS: {
  headerInfo: ComponentPosition;
  introText: ComponentPosition;
  table: ComponentPosition;
  closingText: ComponentPosition;
  printDate: ComponentPosition;
} = {
  headerInfo: { x: 55, y: 125, width: 684 },
  introText: { x: 55, y: 220, width: 684 },
  table: { x: 55, y: 295, width: 684 },
  closingText: { x: 55, y: 790, width: 684 },
  printDate: { x: 55, y: 1060, width: 320 },
};

// Comprehensive regex matching all unsupported CSS Color Module Level 4/5 functions
export const UNSUPPORTED_COLOR_FN_REGEX = /\b(oklab|oklch|color-mix|lab|lch|color|light-dark|hwb)\s*\(/i;

export const extractBalancedFunction = (
  str: string,
  startIndex: number
): { fullMatch: string; endIndex: number } | null => {
  const openParen = str.indexOf('(', startIndex);
  if (openParen === -1) return null;

  let depth = 1;
  let i = openParen + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    i++;
  }

  if (depth === 0) {
    return {
      fullMatch: str.substring(startIndex, i),
      endIndex: i,
    };
  }
  return null;
};

export const convertModernColorToSrgb = (colorExpr: string): string => {
  if (typeof document !== 'undefined') {
    try {
      const helperCanvas = document.createElement('canvas');
      helperCanvas.width = 1;
      helperCanvas.height = 1;
      const helperCtx = helperCanvas.getContext('2d');
      if (helperCtx) {
        helperCtx.fillStyle = '#000000';
        helperCtx.fillStyle = colorExpr;
        const converted = helperCtx.fillStyle;
        if (converted && !UNSUPPORTED_COLOR_FN_REGEX.test(converted)) {
          return converted;
        }
      }
    } catch {
      // fallback below
    }
  }

  if (colorExpr.includes('transparent') || colorExpr.includes('/ 0') || colorExpr.includes(' 0%')) {
    return 'rgba(0, 0, 0, 0)';
  }
  if (colorExpr.includes('1 0 0') || colorExpr.includes('0.98') || colorExpr.includes('white')) {
    return '#ffffff';
  }
  return '#1e293b';
};

export const sanitizeColorString = (val: string): string => {
  if (!val || typeof val !== 'string' || !UNSUPPORTED_COLOR_FN_REGEX.test(val)) {
    return val;
  }

  let result = val
    .replace(/linear-gradient\(\s*in\s+(?:oklab|oklch|lab|lch)\s*,\s*/gi, 'linear-gradient(')
    .replace(/linear-gradient\(\s*to\s+([a-z\s]+)\s+in\s+(?:oklab|oklch|lab|lch)\s*,\s*/gi, 'linear-gradient(to $1, ');

  let maxLoops = 25;
  while (UNSUPPORTED_COLOR_FN_REGEX.test(result) && maxLoops > 0) {
    maxLoops--;
    const match = result.match(UNSUPPORTED_COLOR_FN_REGEX);
    if (!match || match.index === undefined) break;

    const fnCall = extractBalancedFunction(result, match.index);
    if (!fnCall) {
      result = result.replace(match[0], 'rgb(30, 41, 59)(');
      break;
    }

    const converted = convertModernColorToSrgb(fnCall.fullMatch);
    result = result.substring(0, match.index) + converted + result.substring(fnCall.endIndex);
  }

  return result;
};

export const generatePdfFromHtmlElement = async (
  element: HTMLElement,
  filename = 'dokumen.pdf',
): Promise<File | null> => {
  const origWindowGetComputedStyle = window.getComputedStyle;

  const wrapGetComputedStyle = (win: Window) => {
    const orig = win.getComputedStyle.bind(win);
    win.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = orig(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          const val = (target as any)[prop];
          if (typeof val === 'function') {
            if (prop === 'getPropertyValue') {
              return (propertyName: string) => {
                const propVal = target.getPropertyValue(propertyName);
                return sanitizeColorString(propVal);
              };
            }
            return val.bind(target);
          }
          if (typeof val === 'string') {
            return sanitizeColorString(val);
          }
          return val;
        },
      });
    };
  };

  try {
    wrapGetComputedStyle(window);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        if (clonedDoc.defaultView) {
          wrapGetComputedStyle(clonedDoc.defaultView);
        }

        const styleOverride = clonedDoc.createElement('style');
        styleOverride.textContent = `
          :root, * {
            --background: #ffffff !important;
            --foreground: #020817 !important;
            --card: #ffffff !important;
            --card-foreground: #020817 !important;
            --popover: #ffffff !important;
            --popover-foreground: #020817 !important;
            --primary: #0f172a !important;
            --primary-foreground: #f8fafc !important;
            --secondary: #f1f5f9 !important;
            --secondary-foreground: #0f172a !important;
            --muted: #f8fafc !important;
            --muted-foreground: #64748b !important;
            --accent: #f1f5f9 !important;
            --accent-foreground: #0f172a !important;
            --destructive: #ef4444 !important;
            --border: #e2e8f0 !important;
            --input: #e2e8f0 !important;
            --ring: #94a3b8 !important;
            outline-color: transparent !important;
          }
        `;
        clonedDoc.head.appendChild(styleOverride);

        clonedDoc.querySelectorAll('style').forEach((st) => {
          if (st.textContent && UNSUPPORTED_COLOR_FN_REGEX.test(st.textContent)) {
            st.textContent = sanitizeColorString(st.textContent);
          }
        });

        clonedDoc.querySelectorAll('*').forEach((el) => {
          const htmlEl = el as HTMLElement;
          const styleAttr = htmlEl.getAttribute('style');
          if (styleAttr && UNSUPPORTED_COLOR_FN_REGEX.test(styleAttr)) {
            htmlEl.setAttribute('style', sanitizeColorString(styleAttr));
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const blob = pdf.output('blob');
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    return new File([blob], safeFilename, { type: 'application/pdf' });
  } catch (err: any) {
    toast.error(err?.message ?? 'Gagal membuat berkas PDF dokumen');
    return null;
  } finally {
    window.getComputedStyle = origWindowGetComputedStyle;
  }
};
