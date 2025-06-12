import React, { useState, useEffect } from 'react';

const AnalysisTable = ({ data, onRowSelection, results, rowLoadingStates }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [metricsModal, setMetricsModal] = useState({ isOpen: false, data: null });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10); // Show 10 rows per page

  // Calculate pagination
  const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data?.slice(startIndex, endIndex) || [];

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const toggleRowSelection = (rowId) => {
    const newSelectedRows = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    
    setSelectedRows(newSelectedRows);
    onRowSelection(newSelectedRows);
    
    // Update selectAll state based on whether all rows are selected
    setSelectAll(newSelectedRows.length === data?.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      onRowSelection([]);
      setSelectAll(false);
    } else {
      const allRowIds = data?.map(row => row.id) || [];
      setSelectedRows(allRowIds);
      onRowSelection(allRowIds);
      setSelectAll(true);
    }
  };

  const openMetricsModal = (rowData) => {
    const result = results.find(r => r.id === rowData.id);
    setMetricsModal({
      isOpen: true,
      data: {
        ...rowData,
        result: result || null
      }
    });
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Removed forced scroll to top - let user stay at current position
  };

  const closeMetricsModal = () => {
    // Re-enable body scroll
    document.body.style.overflow = 'auto';
    
    setMetricsModal({ isOpen: false, data: null });
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && metricsModal.isOpen) {
        closeMetricsModal();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [metricsModal.isOpen]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const styles = {
    tableContainer: {
      background: 'rgba(31, 41, 55, 0.4)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
    },
    tableHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
    },
    tableTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #94a3b8 60%, #3b82f6 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    selectAllButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      border: 'none',
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      border: '1px solid rgba(5, 150, 105, 0.4)',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 0.5rem',
    },
    tableHead: {
      background: 'rgba(17, 24, 39, 0.8)',
    },
    headerRow: {
      background: 'rgba(17, 24, 39, 0.8)',
    },
    headerCell: {
      padding: '1rem 1.5rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#9ca3af',
      textAlign: 'left',
      borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    bodyRow: {
      background: 'rgba(31, 41, 55, 0.6)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '0.5rem',
    },
    bodyCell: {
      padding: '1rem 1.5rem',
      fontSize: '0.875rem',
      color: '#e5e7eb',
      borderBottom: 'none',
      maxWidth: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    statusCell: {
      minWidth: '150px',
    },
    checkbox: {
      width: '1.25rem',
      height: '1.25rem',
      borderRadius: '0.25rem',
      border: '2px solid rgba(107, 114, 128, 0.5)',
      background: 'rgba(31, 41, 55, 0.8)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      accentColor: '#3b82f6',
    },
    metricsButton: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
      border: '1px solid rgba(5, 150, 105, 0.4)',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(0px)',
      padding: '2rem',
      overflowY: 'auto',
      opacity: 0,
      visibility: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    modalOverlayShow: {
      opacity: 1,
      visibility: 'visible',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
    },
    modalContent: {
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)',
      borderRadius: '1.5rem',
      padding: '2.5rem',
      maxWidth: '700px',
      width: '100%',
      maxHeight: '85vh',
      overflowY: 'auto',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.1)',
      backdropFilter: 'blur(20px) saturate(180%)',
      position: 'relative',
      color: 'white',
      margin: '0 auto',
      transform: 'scale(0.8) translateY(50px)',
      opacity: 0,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    modalContentShow: {
      transform: 'scale(1) translateY(0)',
      opacity: 1,
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
    },
    modalTitle: {
      fontSize: '1.75rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
    },
    closeButton: {
      padding: '0.75rem',
      borderRadius: '0.75rem',
      border: 'none',
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '3rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },

    metricSection: {
      marginBottom: '1.5rem',
    },
    metricLabel: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#94a3b8',
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    metricValue: {
      fontSize: '1rem',
      color: '#e2e8f0',
      marginBottom: '1rem',
      background: 'rgba(31, 41, 55, 0.6)',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      wordBreak: 'break-word',
      lineHeight: '1.5',
    },
    resultBadge: {
      display: 'inline-block',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: '1rem',
      width: '100%',
      boxSizing: 'border-box',
    },
    resultBadgeFlagged: {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
    },
    resultBadgeNotFlagged: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
    },
    confidenceBar: {
      width: '100%',
      height: '0.75rem',
      background: 'rgba(55, 65, 81, 0.5)',
      borderRadius: '0.375rem',
      overflow: 'hidden',
      marginTop: '0.5rem',
    },
    confidenceFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      borderRadius: '0.375rem',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1rem 0',
      borderTop: '1px solid rgba(75, 85, 99, 0.3)',
    },
    paginationInfo: {
      color: 'rgba(156, 163, 175, 0.8)',
      fontSize: '0.875rem',
    },
    paginationControls: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    paginationButton: {
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: 'rgba(75, 85, 99, 0.5)',
      color: 'white',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minWidth: '2.5rem',
    },
    paginationButtonActive: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    },
    paginationButtonDisabled: {
      background: 'rgba(55, 65, 81, 0.3)',
      color: 'rgba(255, 255, 255, 0.3)',
      cursor: 'not-allowed',
    },
  };

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .table-row-hover:hover {
        background: rgba(55, 65, 81, 0.8) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
      
      .table-row-selected {
        background: rgba(59, 130, 246, 0.2) !important;
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
      }
      
      .table-row-selected:hover {
        background: rgba(59, 130, 246, 0.3) !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3) !important;
      }
      
      .select-all-hover:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
      }
      
      .checkbox-checked {
        background: #3b82f6 !important;
        border: 2px solid #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
      
      .status-loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #fbbf24;
        font-weight: 600;
      }
      
      .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid transparent;
        border-top: 2px solid #fbbf24;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      .status-completed {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .status-completed.flagged .result-badge {
        color: #f87171;
        font-weight: 600;
      }
      
      .status-completed.not-flagged .result-badge {
        color: #34d399;
        font-weight: 600;
      }
      
      .confidence {
        font-size: 0.75rem;
        color: rgba(156, 163, 175, 0.8);
      }
      
      .status-pending {
        color: #9ca3af;
        font-weight: 500;
      }
      
      .table-row-enter {
        animation: slideInUp 0.3s ease-out;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Seamless Modal Animations */
      .modal-overlay-enter {
        opacity: 0;
        visibility: hidden;
        background-color: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
      }
      
      .modal-overlay-enter-active {
        opacity: 1;
        visibility: visible;
        background-color: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(12px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .modal-content-enter {
        transform: scale(0.8) translateY(50px);
        opacity: 0;
      }
      
      .modal-content-enter-active {
        transform: scale(1) translateY(0);
        opacity: 1;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transition-delay: 0.1s;
      }
      
      .metrics-section-enter {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .metrics-section-enter-active {
        opacity: 1;
        transform: translateY(0);
      }
      
      .close-button-hover:hover {
        background: rgba(239, 68, 68, 0.2) !important;
        transform: scale(1.1);
        border-color: rgba(239, 68, 68, 0.5);
      }
      
      .metrics-button-hover:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={styles.tableContainer}>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(156, 163, 175, 0.8)',
          fontSize: '1.1rem',
        }}>
          📋 No data to display. Please upload a file to begin analysis.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableHeader}>
        <h3 style={styles.tableTitle}>📊 Analysis Data</h3>
        <button
          onClick={toggleSelectAll}
          style={styles.selectAllButton}
          className="select-all-hover"
        >
          {selectAll ? '❌ Deselect All' : '✅ Select All'}
        </button>
      </div>
      
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Select</th>
              <th style={styles.headerCell}>ID</th>
              <th style={styles.headerCell}>Justification Maker</th>
              <th style={styles.headerCell}>Justification Checker</th>
              <th style={styles.headerCell}>Status</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => {
              const isSelected = selectedRows.includes(row.id);
              const isLoading = rowLoadingStates[row.id];
              const result = results.find(r => r.id === row.id);
              
              return (
                <tr
                  key={row.id}
                  style={styles.bodyRow}
                  className={`table-row-enter ${isSelected ? 'table-row-selected' : 'table-row-hover'}`}
                  onClick={() => toggleRowSelection(row.id)}
                >
                  <td style={styles.bodyCell}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(row.id)}
                      style={styles.checkbox}
                      className={isSelected ? "checkbox-checked" : ""}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={styles.bodyCell}>{row.id}</td>
                  <td style={styles.bodyCell} title={row.justificationMaker}>
                    {row.justificationMaker?.substring(0, 100)}
                    {row.justificationMaker?.length > 100 ? '...' : ''}
                  </td>
                  <td style={styles.bodyCell} title={row.justificationChecker}>
                    {row.justificationChecker?.substring(0, 100)}
                    {row.justificationChecker?.length > 100 ? '...' : ''}
                  </td>
                  <td style={{...styles.bodyCell, ...styles.statusCell}}>
                    {isLoading ? (
                      <div className="status-loading">
                        <div className="spinner"></div>
                        Analyzing...
                      </div>
                    ) : result ? (
                      <div className={`status-completed ${result.result.predictedClass === 1 ? 'flagged' : 'not-flagged'}`}>
                        <div className="result-badge">
                          {result.result.predictedClass === 1 ? '🚩 Flagged' : '✅ Not Flagged'}
                        </div>
                        <div className="confidence">
                          Confidence: {(Math.max(result.result.probability0, result.result.probability1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <div className="status-pending">⏳ Pending</div>
                    )}
                  </td>
                  <td style={styles.bodyCell}>
                    {result && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMetricsModal(row);
                        }}
                        style={styles.metricsButton}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.3)';
                        }}
                      >
                        📈 Metrics
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={styles.paginationContainer}>
          <div style={styles.paginationInfo}>
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} rows
          </div>
          <div style={styles.paginationControls}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationButton,
                ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = 'rgba(107, 114, 128, 0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = 'rgba(75, 85, 99, 0.5)';
                }
              }}
            >
              ‹
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === pageNum ? styles.paginationButtonActive : {})
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== pageNum) {
                      e.target.style.background = 'rgba(107, 114, 128, 0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== pageNum) {
                      e.target.style.background = 'rgba(75, 85, 99, 0.5)';
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationButton,
                ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = 'rgba(107, 114, 128, 0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = 'rgba(75, 85, 99, 0.5)';
                }
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Seamless Metrics Modal */}
      {metricsModal.isOpen && metricsModal.data && (
        <div 
          style={{
            ...styles.modalOverlay,
            ...(metricsModal.isOpen ? styles.modalOverlayShow : {})
          }}
          className={metricsModal.isOpen ? 'modal-overlay-enter-active' : 'modal-overlay-enter'}
          onClick={closeMetricsModal}
        >
          <div 
            style={{
              ...styles.modalContent,
              ...(metricsModal.isOpen ? styles.modalContentShow : {})
            }}
            className={metricsModal.isOpen ? 'modal-content-enter-active' : 'modal-content-enter'}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📊 Analysis Metrics</h3>
              <button
                style={styles.closeButton}
                className="close-button-hover"
                onClick={closeMetricsModal}
                title="Close metrics (Press Escape)"
              >
                ×
              </button>
            </div>

            <div style={styles.metricSection} className="metrics-section-enter-active">
              <div style={styles.metricLabel}>Row ID</div>
              <div style={styles.metricValue}>{metricsModal.data.id}</div>
            </div>

            {metricsModal.data.result && (
              <>
                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Analysis Result</div>
                  <div style={{
                    ...styles.resultBadge,
                    ...(metricsModal.data.result.result.predictedClass === 1 ? styles.resultBadgeFlagged : styles.resultBadgeNotFlagged)
                  }}>
                    {metricsModal.data.result.result.predictedClass === 1 ? '🚩 FLAGGED' : '✅ NOT FLAGGED'}
                  </div>
                </div>

                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Confidence Level</div>
                  <div style={styles.metricValue}>
                    {(Math.max(metricsModal.data.result.result.probability0, metricsModal.data.result.result.probability1) * 100).toFixed(2)}%
                    <div style={styles.confidenceBar}>
                      <div
                        style={{
                          ...styles.confidenceFill,
                          width: `${Math.max(metricsModal.data.result.result.probability0, metricsModal.data.result.result.probability1) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Probability Breakdown</div>
                  <div style={styles.metricValue}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Not Flagged:</strong> {(metricsModal.data.result.result.probability0 * 100).toFixed(2)}%
                    </div>
                    <div>
                      <strong>Flagged:</strong> {(metricsModal.data.result.result.probability1 * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Processing Time</div>
                  <div style={styles.metricValue}>
                    {metricsModal.data.result.processingTime?.toFixed(2) || 'N/A'} seconds
                  </div>
                </div>

                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Justification Maker</div>
                  <div style={styles.metricValue}>
                    {metricsModal.data.justificationMaker || 'N/A'}
                  </div>
                </div>

                <div style={styles.metricSection} className="metrics-section-enter-active">
                  <div style={styles.metricLabel}>Justification Checker</div>
                  <div style={styles.metricValue}>
                    {metricsModal.data.justificationChecker || 'N/A'}
                  </div>
                </div>

                {metricsModal.data.result.rawOutput && (
                  <div style={styles.metricSection} className="metrics-section-enter-active">
                    <div style={styles.metricLabel}>Raw AI Response</div>
                    <div style={{...styles.metricValue, fontSize: '0.875rem', fontFamily: 'monospace'}}>
                      {metricsModal.data.result.rawOutput}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTable;
