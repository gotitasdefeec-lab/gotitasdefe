import React from "react";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex, onClose }) => {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <button
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ×
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold px-2 focus:outline-none"
        onClick={e => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
        aria-label="Anterior"
      >
        ‹
      </button>
      <img
        src={images[index]}
        alt={`Imagen ${index + 1}`}
        className="max-h-[80vh] max-w-[90vw] rounded shadow-lg border-4 border-white"
        onClick={e => e.stopPropagation()}
      />
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold px-2 focus:outline-none"
        onClick={e => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
        aria-label="Siguiente"
      >
        ›
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${i === index ? 'bg-white border-blue-500' : 'bg-gray-400 border-white'}`}
            onClick={e => { e.stopPropagation(); setIndex(i); }}
            aria-label={`Ver imagen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Lightbox;
