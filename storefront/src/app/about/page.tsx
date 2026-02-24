
import { getStoreGeneral } from '../../services/storeGeneralService';

export const dynamic = 'force-dynamic';

function sanitizeAboutHtml(html: string): string {
  if (!html) return '';

  const allowedTags = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'a',
  ]);

  const sanitizeClassList = (classValue: string) => {
    return String(classValue || '')
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => /^ql-align-(left|center|right|justify)$/.test(c) || /^ql-indent-[0-8]$/.test(c))
      .join(' ');
  };

  return html
    .replace(/<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|table|thead|tbody|tr|td|th)[^>]*>/gi, '')
    .replace(/<\/?(div|section|article|header|footer|main|figure|figcaption|span|font|h1|h2|h3|h4|h5|h6)[^>]*>/gi, '')
    .replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, rawTag: string, rawAttrs: string) => {
      const tag = String(rawTag || '').toLowerCase();
      const isClosing = /^<\//.test(match);
      const attrs = String(rawAttrs || '');

      if (!allowedTags.has(tag)) {
        return '';
      }

      if (isClosing) {
        return `</${tag}>`;
      }

      if (tag === 'a') {
        const hrefMatch = attrs.match(/href\s*=\s*(["'])(.*?)\1/i);
        const href = hrefMatch?.[2] || '#';
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
      }

      if (tag === 'br') {
        return '<br />';
      }

      if (tag === 'li') {
        const dataListMatch = attrs.match(/data-list\s*=\s*(["'])(bullet|ordered)\1/i);
        const classMatch = attrs.match(/class\s*=\s*(["'])(.*?)\1/i);
        const safeClasses = sanitizeClassList(classMatch?.[2] || '');
        const dataList = dataListMatch?.[2]?.toLowerCase();

        return `<li${dataList ? ` data-list="${dataList}"` : ''}${safeClasses ? ` class="${safeClasses}"` : ''}>`;
      }

      if (tag === 'p' || tag === 'ul' || tag === 'ol') {
        const classMatch = attrs.match(/class\s*=\s*(["'])(.*?)\1/i);
        const safeClasses = sanitizeClassList(classMatch?.[2] || '');
        return `<${tag}${safeClasses ? ` class="${safeClasses}"` : ''}>`;
      }

      return `<${tag}>`;
    })
    .replace(/&nbsp;/gi, ' ');
}

export default async function AboutPage() {
  let general: any = { about: '' };
  
  try {
    general = await getStoreGeneral();
  } catch (error) {
    console.error('Error al cargar información general:', error);
    // Continuar con valores por defecto
  }

  // Formateo automático: convierte saltos dobles en párrafos y líneas con guion en listas
  // Solo si el contenido NO es HTML (para retrocompatibilidad con texto plano)
  function formatAboutText(text: string) {
    if (!text) return '<p>No hay información disponible.</p>';
    
    // Si ya es HTML (contiene tags), devolverlo tal cual
    if (/<[^>]+>/.test(text)) {
      return text;
    }
    
    // Listas: líneas que empiezan con "- "
    const lines = text.split(/\r?\n/);
    let html = '';
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- ')) {
        if (!inList) { html += '<ul style="margin:1em auto;display:inline-block;text-align:left">'; inList = true; }
        html += `<li>${line.substring(2)}</li>`;
      } else if (line === '') {
        if (inList) { html += '</ul>'; inList = false; }
        // Solo agrega salto de párrafo si la línea anterior no era vacía
        if (i > 0 && lines[i - 1].trim() !== '') html += '<p></p>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${line}</p>`;
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  // Sanitizar y formatear el contenido
  const aboutText = typeof general?.about === 'string' ? general.about : '';
  const formattedContent = formatAboutText(aboutText);
  const normalizedContent = sanitizeAboutHtml(formattedContent);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-3xl p-6 md:p-10 border border-gray-100 flex flex-col items-center overflow-hidden">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center">Nosotros</h1>
        </div>
        <div
          className="w-full max-w-[70ch] mx-auto px-1 sm:px-2 text-gray-800 text-left sm:text-center leading-relaxed [&_*]:max-w-full [&_*]:whitespace-pre-wrap [&_*]:break-words [&_p]:my-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-none [&_ol]:pl-0 [&_li]:my-1 [&_li[data-list='bullet']]:list-disc [&_li[data-list='bullet']]:ml-6 [&_li[data-list='ordered']]:list-decimal [&_li[data-list='ordered']]:ml-6 [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify [&_.ql-indent-1]:ml-4 [&_.ql-indent-2]:ml-8 [&_.ql-indent-3]:ml-12 [&_a]:underline"
          style={{ background: 'white', overflowWrap: 'anywhere', wordBreak: 'break-all' }}
          dangerouslySetInnerHTML={{ __html: normalizedContent }}
        />
      </div>
    </div>
  );
}
