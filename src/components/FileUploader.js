import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const FileUploader = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFiles = (files) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Check if it's an Excel file
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const isExcelFile = allowedTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );
    
    if (!isExcelFile) {
      setUploadStatus('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setUploadStatus('Processing file...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setUploadStatus('File appears to be empty or has no data rows');
          return;
        }
        
        // Get headers (first row)
        const headers = jsonData[0];
        
        // Find relevant column indices
        const idIndex = headers.findIndex(h => 
          h && h.toString().toLowerCase().includes('id')
        );
        const makerIndex = headers.findIndex(h => 
          h && h.toString().toLowerCase().includes('maker') && 
          h.toString().toLowerCase().includes('justification')
        );
        const checkerIndex = headers.findIndex(h => 
          h && h.toString().toLowerCase().includes('checker') && 
          h.toString().toLowerCase().includes('justification')
        );
        
        console.log('Found column indices:', { idIndex, makerIndex, checkerIndex });
        console.log('Headers:', headers);
        
        // Process data rows
        const processedData = jsonData.slice(1).map((row, index) => {
          return {
            id: idIndex >= 0 ? (row[idIndex] || `Row-${index + 1}`) : `Row-${index + 1}`,
            justificationMaker: makerIndex >= 0 ? (row[makerIndex] || '') : '',
            justificationChecker: checkerIndex >= 0 ? (row[checkerIndex] || '') : '',
            alertId: idIndex >= 0 ? row[idIndex] : `Alert-${index + 1}`,
          };
        }).filter(row => 
          row.justificationMaker.trim() !== '' || 
          row.justificationChecker.trim() !== ''
        );
        
        console.log('Processed data:', processedData.slice(0, 3)); // Log first 3 rows
        
        if (processedData.length === 0) {
          setUploadStatus('No valid data found. Please check your file format.');
          return;
        }
        
        setUploadStatus(`Successfully loaded ${processedData.length} rows`);
        onFileUpload(processedData);
        
      } catch (error) {
        console.error('Error processing file:', error);
        setUploadStatus('Error processing file. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      setUploadStatus('Error reading file');
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    header: {
      textAlign: 'center',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#5eead4',
      marginBottom: '0.5rem',
    },
    description: {
      fontSize: '1rem',
      color: '#9ca3af',
    },
    dropZone: {
      border: `2px dashed ${dragActive ? '#6366f1' : '#4b5563'}`,
      borderRadius: '0.75rem',
      padding: '3rem 2rem',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: dragActive ? '#1e1b4b' : '#374151',
    },
    dropZoneContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    },
    icon: {
      fontSize: '3rem',
      color: dragActive ? '#6366f1' : '#6b7280',
    },
    dropText: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#e5e7eb',
    },
    dropSubtext: {
      fontSize: '0.875rem',
      color: '#9ca3af',
    },
    fileInput: {
      display: 'none',
    },
    button: {
      backgroundColor: '#6366f1',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    status: {
      padding: '1rem',
      borderRadius: '0.5rem',
      textAlign: 'center',
      fontWeight: '600',
    },
    statusSuccess: {
      backgroundColor: '#065f46',
      color: '#6ee7b7',
      border: '1px solid #10b981',
    },
    statusError: {
      backgroundColor: '#7f1d1d',
      color: '#fca5a5',
      border: '1px solid #ef4444',
    },
    statusProcessing: {
      backgroundColor: '#92400e',
      color: '#fbbf24',
      border: '1px solid #f59e0b',
    },
    requirements: {
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      border: '1px solid #4b5563',
    },
    requirementsTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#e5e7eb',
      marginBottom: '1rem',
    },
    requirementsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    requirementItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#d1d5db',
    },
    checkIcon: {
      color: '#10b981',
      fontSize: '1rem',
    },
  };

  const getStatusStyle = () => {
    if (uploadStatus.includes('Successfully')) return styles.statusSuccess;
    if (uploadStatus.includes('Error') || uploadStatus.includes('Please')) return styles.statusError;
    if (uploadStatus.includes('Processing')) return styles.statusProcessing;
    return styles.statusProcessing;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Upload Excel File</h2>
        <p style={styles.description}>
          Upload your data file for analysis
        </p>
      </div>

      <div
        style={styles.dropZone}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div style={styles.dropZoneContent}>
          <div style={styles.icon}>📄</div>
          <div style={styles.dropText}>
            {dragActive ? 'Drop your file here' : 'Drag and drop your Excel file here'}
          </div>
          <div style={styles.dropSubtext}>or click to browse files</div>
          <button style={styles.button} type="button">
            Choose File
          </button>
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        style={styles.fileInput}
        accept=".xlsx,.xls"
        onChange={handleChange}
      />

      {uploadStatus && (
        <div style={{...styles.status, ...getStatusStyle()}}>
          {uploadStatus}
        </div>
      )}

      <div style={styles.requirements}>
        <h3 style={styles.requirementsTitle}>File Requirements</h3>
        <ul style={styles.requirementsList}>
          <li style={styles.requirementItem}>
            <span style={styles.checkIcon}>✓</span>
            Excel file format (.xlsx or .xls)
          </li>
          <li style={styles.requirementItem}>
            <span style={styles.checkIcon}>✓</span>
            Contains columns with "ID", "Maker Justification", and "Checker Justification"
          </li>
          <li style={styles.requirementItem}>
            <span style={styles.checkIcon}>✓</span>
            At least one justification field must contain text
          </li>
          <li style={styles.requirementItem}>
            <span style={styles.checkIcon}>✓</span>
            First row should contain column headers
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;
