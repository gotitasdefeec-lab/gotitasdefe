import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// Importación dinámica de React Quill (versión compatible con React 19)
let ReactQuill: any = null;
if (typeof window !== 'undefined') {
  const ReactQuillModule = require('react-quill-new');
  ReactQuill = ReactQuillModule.default ?? ReactQuillModule;
  require('react-quill-new/dist/quill.snow.css');
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  label,
  minHeight = 200,
}) => {
  const [mounted, setMounted] = useState(false);
  
  // Asegurar que siempre tengamos un string válido
  const safeValue = value ?? '';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configuración de las herramientas del editor
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }], // Títulos
        ['bold', 'italic', 'underline', 'strike'], // Negritas, cursiva, subrayado, tachado
        [{ list: 'ordered' }, { list: 'bullet' }], // Listas
        [{ indent: '-1' }, { indent: '+1' }], // Sangría
        [{ align: [] }], // Alineación
        ['link'], // Enlaces
        [{ color: [] }, { background: [] }], // Colores
        ['clean'], // Limpiar formato
      ],
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'indent',
    'align',
    'link',
    'color',
    'background',
  ];

  // No renderizar hasta que el componente esté montado en el cliente
  if (!mounted || !ReactQuill) {
    return (
      <Box>
        {label && (
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            {label}
          </Typography>
        )}
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: '#f9f9f9',
            minHeight: `${minHeight + 42}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Cargando editor...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: '#fff',
          '& .ql-container': {
            minHeight: `${minHeight}px`,
            fontFamily: 'inherit',
            fontSize: '14px',
          },
          '& .ql-editor': {
            minHeight: `${minHeight}px`,
          },
          '& .ql-toolbar': {
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ccc',
          },
          '& .ql-editor.ql-blank::before': {
            color: '#aaa',
            fontStyle: 'normal',
          },
        }}
      >
        <ReactQuill
          theme="snow"
          value={safeValue}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </Box>
    </Box>
  );
};

export default RichTextEditor;
