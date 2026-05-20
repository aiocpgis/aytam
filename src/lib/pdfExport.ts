import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrphanRecord } from "../types/orphan.types";

// Note: jsPDF default fonts do not support Arabic.
// For a production app, a custom font (like Amiri or Tajawal) must be added via VFS.
// This provides a structural implementation of the PDF export.

export function exportDashboardStatsToPDF(records: OrphanRecord[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Adding title
  doc.setFontSize(20);
  // We use English fallback for title if Arabic doesn't render well by default,
  // but we'll try Arabic in case standard works (it usually requires addFileToVFS).
  doc.text("Rifq Platform - Orphans Statistics Report", 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

  const sponsored = records.filter((item) => item.sponsorshipStatus === "مكفول").length;
  const waitingSponsor = records.filter((item) => item.sponsorshipStatus === "بانتظار كافل").length;
  const stoppedSponsor = records.filter((item) => item.sponsorshipStatus === "متوقف").length;
  const newFiles = records.filter((item) => item.fileStatus === "جديد" || item.fileStatus === "جديد بانتظار المراجعة").length;

  const total = records.length;

  // Add Summary Table
  doc.setFontSize(14);
  doc.text("General Statistics Overview", 14, 45);

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
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
  });

  // Add Governorate breakdown
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

  doc.text("Geographical Distribution", 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Governorate / City", "Orphans Count"]],
    body: governorateStats,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] }, // Slate-900
  });

  doc.save("Rifq_Platform_Statistics.pdf");
}
