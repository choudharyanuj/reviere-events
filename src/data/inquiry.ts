/** The exact message format the original contact form produced. */
export function buildInquiryMessage(f: { name: string; phone: string; eventType: string; eventDate: string; message: string }) {
  let m = `Hi Manish! I would like to inquire about Reviere Events planning services.\n\n`;
  m += `• Name: ${f.name}\n`;
  m += `• Phone: ${f.phone}\n`;
  if (f.eventType) m += `• Event Type: ${f.eventType}\n`;
  if (f.eventDate) m += `• Tentative Date: ${f.eventDate}\n`;
  if (f.message) m += `• Details: ${f.message}`;
  return m;
}
