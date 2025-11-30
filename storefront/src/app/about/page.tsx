export const dynamic = 'force-dynamic';

import { getStoreGeneral } from '../../services/storeGeneralService';

export default async function AboutPage() {
  const general = await getStoreGeneral();

  // Formateo automático: convierte saltos dobles en párrafos y líneas con guion en listas
  function formatAboutText(text: string) {
    if (!text) return '<p>No hay información disponible.</p>';
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
        if (i > 0 && lines[i-1].trim() !== '') html += '<p></p>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${line}</p>`;
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-3xl p-6 md:p-10 border border-gray-100 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center">Nosotros</h1>
        </div>
        <div
          className="prose prose-lg max-w-none text-gray-800 text-center"
          style={{ background: 'white' }}
          dangerouslySetInnerHTML={{ __html: formatAboutText(general.about || '') }}
        />
      </div>
    </div>
  );
}
