import { getStoreGeneral } from '../../services/storeGeneralService';

export default async function ContactPage() {
  const general = await getStoreGeneral();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-3xl p-6 md:p-10 border border-gray-100 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.34V6.5A2.5 2.5 0 0018.5 4h-13A2.5 2.5 0 003 6.5v11A2.5 2.5 0 005.5 20h13a2.5 2.5 0 002.5-2.5v-3.84a2 2 0 000-3.32z" /></svg>
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center">Contacto</h1>
        </div>
        <div className="prose prose-lg max-w-none text-gray-800 text-center" style={{ background: 'white' }} dangerouslySetInnerHTML={{ __html: general.contact || 'No hay información de contacto disponible.' }} />
      </div>
    </div>
  );
}
