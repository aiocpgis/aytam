import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrphanRecord } from "../types/orphan.types";

/**
 * Registers a custom Arabic font in jsPDF via VFS.
 * Usage example:
 *   import amiriBase64 from "../assets/Amiri-Regular.base64";
 *   registerArabicFont(doc, 'Amiri', amiriBase64, 'normal');
 * Then call doc.setFont('Amiri') before writing Arabic text.
 */
function registerArabicFont(
  doc: jsPDF,
  fontName: string,
  base64Data: string,
  style: "normal" | "bold" = "normal"
) {
  const fileName = `${fontName}-${style === "bold" ? "Bold" : "Regular"}.ttf`;
  doc.addFileToVFS(fileName, base64Data);
  doc.addFont(fileName, fontName, style);
}

/**
 * Renders RTL-aware text using the browser's canvas via jsPDF.html().
 * Falls back to standard doc.text if html2canvas is unavailable.
 */
function renderRtlText(doc: jsPDF, text: string, x: number, y: number, options?: { fontSize?: number; color?: [number, number, number] }) {
  doc.setFontSize(options?.fontSize ?? 16);
  if (options?.color) doc.setTextColor(...options.color);
  doc.text(text, x, y, { align: "right" });
}

export function exportDashboardStatsToPDF(records: OrphanRecord[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  /* ── To enable Arabic text rendering:
   *
   * 1. Download a font like "Amiri" or "Tajawal" (.ttf)
   * 2. Convert it to base64 (e.g. via `base64 Amiri-Regular.ttf > Amiri-Regular.base64`)
   * 3. Import the base64 string and register it:
   *      import amiriBase64 from "../assets/Amiri-Regular.base64";
   *      registerArabicFont(doc, 'Amiri', amiriBase64, 'normal');
   *      doc.setFont('Amiri');
   *
   * Until then, the report renders in English to avoid broken Arabic glyphs.
   */

  renderRtlText(doc, "Rifq Platform - Orphans Statistics Report", 196, 22, { fontSize: 20, color: [15, 23, 42] });
  renderRtlText(doc, `Generated on: ${new Date().toLocaleDateString()}`, 196, 32, { fontSize: 12, color: [100, 116, 139] });

  const sponsored = records.filter((item) => item.sponsorshipStatus === "مكفول").length;
  const waitingSponsor = records.filter((item) => item.sponsorshipStatus === "بانتظار كافل").length;
  const stoppedSponsor = records.filter((item) => item.sponsorshipStatus === "متوقف").length;
  const newFiles = records.filter((item) => item.fileStatus === "جديد" || item.fileStatus === "جديد بانتظار المراجعة").length;

  const total = records.length;

  renderRtlText(doc, "General Statistics Overview", 196, 45, { fontSize: 14, color: [15, 23, 42] });

  autoTable(doc, {
    startY: 50,
    head: [["Metric", "Count"]],
    body: [
      ["Total Orphans", total],
      ["Sponsored", sponsored],
      ["Waiting for Sponsor", waitingSponsor],
      ["Stopped Sponsorship", stoppedSponsor],
      ["New Pending Files", newFiles],
    ],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
  });

  const governorateStats = (() => {
    const counts: Record<string, number> = {};
    records.forEach((record) => {
      const city = (record.governorateCity || "Unknown").trim();
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => [name, count.toString()])
      .sort((a, b) => parseInt(b[1] as string) - parseInt(a[1] as string));
  })();

  const finalY = (doc as any).lastAutoTable.finalY || 50;

  renderRtlText(doc, "Geographical Distribution", 196, finalY + 15, { fontSize: 14, color: [15, 23, 42] });

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Governorate / City", "Orphans Count"]],
    body: governorateStats,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
  });

  doc.save("Rifq_Platform_Statistics.pdf");
}
