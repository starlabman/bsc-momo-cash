import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InvoiceData {
  reference_id: string;
  type: 'onramp' | 'offramp';
  status: string;
  created_at: string;
  xof_amount: number;
  amount?: number; // crypto amount
  token?: string;
  network?: string;
  phone?: string;
  operator?: string;
  country?: string;
  recipient_address?: string;
  exchange_rate?: number;
}

const BRAND = {
  violet: [124, 58, 237] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
};

export function generateInvoicePDF(tx: InvoiceData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header band
  doc.setFillColor(...BRAND.violet);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setFillColor(...BRAND.orange);
  doc.rect(pageW - 60, 0, 60, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('SikaPay', 15, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Crypto <> Mobile Money · No KYC', 15, 30);
  doc.text('sikapay.app', 15, 37);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageW - 15, 25, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(tx.reference_id, pageW - 15, 33, { align: 'right' });

  // Reset for body
  y = 60;
  doc.setTextColor(...BRAND.dark);

  // Info box
  doc.setFillColor(...BRAND.light);
  doc.rect(15, y, pageW - 30, 30, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.gray);
  doc.text('DATE', 20, y + 8);
  doc.text('RÉFÉRENCE', 75, y + 8);
  doc.text('TYPE', 130, y + 8);
  doc.text('STATUT', 170, y + 8);

  doc.setTextColor(...BRAND.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: fr }), 20, y + 16);
  doc.text(tx.reference_id, 75, y + 16);
  doc.text(tx.type === 'onramp' ? 'Achat crypto' : 'Vente crypto', 130, y + 16);
  doc.text(tx.status, 170, y + 16);

  y += 45;

  // Détails transaction
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Détails de la transaction', 15, y);
  y += 8;
  doc.setDrawColor(...BRAND.violet);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageW - 15, y);
  y += 8;

  const rows: [string, string][] = [];
  rows.push(['Montant XOF', `${tx.xof_amount.toLocaleString('fr-FR')} XOF`]);
  if (tx.amount && tx.token) rows.push(['Montant crypto', `${tx.amount} ${tx.token}`]);
  if (tx.network) rows.push(['Réseau blockchain', tx.network.toUpperCase()]);
  if (tx.exchange_rate) rows.push(['Taux appliqué', `1 USD = ${tx.exchange_rate.toLocaleString('fr-FR')} XOF`]);
  if (tx.country) rows.push(['Pays', tx.country]);
  if (tx.operator) rows.push(['Opérateur Mobile Money', tx.operator]);
  if (tx.phone) rows.push(['Numéro Mobile Money', tx.phone]);
  if (tx.recipient_address) rows.push(['Adresse destinataire', tx.recipient_address]);

  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.dark);
    const lines = doc.splitTextToSize(String(value), 100);
    doc.text(lines, pageW - 20, y, { align: 'right' });
    y += 7 + (lines.length - 1) * 5;
  });

  // Total
  y += 5;
  doc.setFillColor(...BRAND.violet);
  doc.rect(15, y, pageW - 30, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MONTANT TOTAL', 20, y + 11);
  doc.setFontSize(14);
  doc.text(`${tx.xof_amount.toLocaleString('fr-FR')} XOF`, pageW - 20, y + 11, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(...BRAND.light);
  doc.line(15, footerY, pageW - 15, footerY);
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.gray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Ce document est une preuve de transaction générée automatiquement par SikaPay.',
    pageW / 2,
    footerY + 6,
    { align: 'center' }
  );
  doc.text(
    'Pour toute question, contactez-nous via sikapay.app/contact',
    pageW / 2,
    footerY + 11,
    { align: 'center' }
  );
  doc.text(
    `Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`,
    pageW / 2,
    footerY + 16,
    { align: 'center' }
  );

  doc.save(`SikaPay-Facture-${tx.reference_id}.pdf`);
}
