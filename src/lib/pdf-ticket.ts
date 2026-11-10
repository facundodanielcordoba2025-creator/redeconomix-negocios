import { jsPDF } from "jspdf";

export interface TicketData {
  businessName: string;
  date: string;
  total: number;
  paymentMethod: string;
  items: { name: string; qty: number; price: number }[];
  customerName?: string;
  ticketId?: string;
}

export const generateTicketPDF = (data: TicketData) => {
  // Configurado para rollo térmico de 58mm (ancho real 58mm, printable ~48mm)
  // Altura dinámica: base de 70mm + 5mm por cada producto escaneado
  const itemRowHeight = 5;
  const baseHeight = 70; 
  const height = baseHeight + (data.items.length * itemRowHeight);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, height]
  });

  // Estilos de Cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.businessName.toUpperCase(), 29, 8, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`TICKET N° ${data.ticketId || Date.now().toString().slice(-5)}`, 29, 13, { align: "center" });
  doc.text(`${data.date}`, 29, 17, { align: "center" });
  
  if(data.customerName && data.customerName !== 'Cliente Final') {
     doc.text(`CLIENTE: ${data.customerName.toUpperCase()}`, 29, 21, { align: "center" });
  }

  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  doc.line(2, 24, 56, 24); // Separador

  let y = 29;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  
  // Encabezados de tabla
  doc.text("CANT", 4, y);
  doc.text("DETALLE", 14, y);
  doc.text("TOTAL", 44, y);
  y += 3;
  
  doc.setLineWidth(0.2);
  doc.line(2, y, 56, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  data.items.forEach(item => {
    // Truncar nombre a 16 caracteres para que no desborde la tira térmica de 58mm
    const nameTrunc = item.name.substring(0, 16);
    const totalLine = `$${(item.price * item.qty).toLocaleString()}`;
    
    doc.text(`${item.qty}`, 4, y);
    doc.text(`${nameTrunc}`, 14, y);
    doc.text(`${totalLine}`, 44, y);
    y += 4;
  });

  doc.line(2, y, 56, y);
  y += 6;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: $${data.total.toLocaleString()}`, 29, y, { align: "center" });
  
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  
  const pagoTexto = data.paymentMethod === 'mixed' ? 'MIXTO' : data.paymentMethod === 'cash' ? 'EFECTIVO' : data.paymentMethod === 'credit' ? 'CUENTA CORRIENTE' : 'TRANF. / MP';
  doc.text(`METODO: ${pagoTexto}`, 29, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("¡GRACIAS POR SU COMPRA!", 29, y, { align: "center" });
  y += 4;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("SISTEMAS.REDECONOMIX.COM", 29, y, { align: "center" });
  
  // Descargar o Compartir el PDF
  doc.save(`R-TICKET-${Date.now().toString().slice(-4)}.pdf`);
};
