import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, Typography } from '@mui/material';

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
    'bullet',
    'indent',
    'align',
    'link',
    'color',
    'background',
  ];

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
          value={value}
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
