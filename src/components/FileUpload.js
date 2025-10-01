import React, { useState, useRef } from 'react';

const FileUpload = ({ onFileSelect, selectedFile, accept, placeholder }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file) => {
    // Validar tipo de archivo
    if (accept && !file.type.match(accept.replace(/\./g, '').replace(/,/g, '|'))) {
      alert('Tipo de archivo no válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB');
      return;
    }

    onFileSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    const isImage = selectedFile.type.startsWith('image/');
    const isPdf = selectedFile.type === 'application/pdf';
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const imgHeight = isMobile ? 180 : 300;
    const boxMinHeight = isMobile ? 140 : 200;
    const infoPadding = isMobile ? '8px' : '12px';
    const removeBtnSize = isMobile ? 24 : 28;
    return (
      <div className="file-preview" style={{ 
        position: 'relative', 
        border: '1px solid #e5e7eb', 
        borderRadius: 12, 
        overflow: 'hidden', 
        width: '100%', 
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          type="button"
          onClick={handleRemoveFile}
          title="Eliminar archivo"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(17,24,39,0.8)', color: '#fff', border: 'none', borderRadius: 999, width: removeBtnSize, height: removeBtnSize, cursor: 'pointer' }}
        >
          ×
        </button>
        {isImage ? (
          <>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt={selectedFile.name}
              style={{ width: '100%', height: imgHeight, objectFit: 'contain' }}
            />
            <div style={{ padding: infoPadding, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </>
        ) : isPdf ? (
          <div style={{ 
            padding: isMobile ? '12px' : '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#111827',
            background: '#fff',
            width: '100%',
            minHeight: boxMinHeight
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '12px' }}>📄</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: isMobile ? '12px' : '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#111827',
            background: '#fff',
            width: '100%',
            minHeight: boxMinHeight
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '12px' }}>📦</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        renderPreview()
      ) : (
        <div
          className={`file-upload ${isDragOver ? 'dragover' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{ border: '1px dashed #d1d5db', borderRadius: 12, padding: 16, textAlign: 'center', background: '#fff', cursor: 'pointer', minHeight: (typeof window !== 'undefined' && window.innerWidth <= 768) ? 140 : 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="file-upload-icon" style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div className="file-upload-text" style={{ color: '#111827', fontWeight: 600 }}>
            {placeholder || 'Haz clic o arrastra un archivo aquí'}
          </div>
          <div className="file-upload-hint" style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            Máximo 5MB • {accept || 'Todos los formatos'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

