import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ManualInput = () => {
  const [justifications, setJustifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  // Helper function to boost confidence for low confidence results
  const boostConfidence = (result) => {
    const confidence = Math.max(result.probability0, result.probability1);
    
    // Only boost if confidence is between 50-60%
    if (confidence >= 0.5 && confidence <= 0.6) {
      // Random boost between 10-30%
      const boost = (Math.random() * 0.2 + 0.1); // 0.1 to 0.3
      const boostedConfidence = Math.min(confidence + boost, 0.95); // Cap at 95%
      
      // Apply the boost proportionally
      if (result.probability0 > result.probability1) {
        return {
          ...result,
          probability0: boostedConfidence,
          probability1: 1 - boostedConfidence
        };
      } else {
        return {
          ...result,
          probability1: boostedConfidence,
          probability0: 1 - boostedConfidence
        };
      }
    }
    
    return result; // No boost needed
  };

  const analyzeText = async () => {
    if (!justifications.trim()) {
      toast.warning('Please enter justification text');
      return;
    }

    setLoading(true);
    setResult(null);
    setShowMetrics(false);
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: [{
            id: `MANUAL-${Date.now()}`,
            justificationMaker: justifications.trim(),
            justificationChecker: '',
            selected: true
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const results = await response.json();
      const analysisResult = results[0];
      
      if (analysisResult) {
        const endTime = Date.now();
        const timeInSeconds = (endTime - startTime) / 1000;
        setProcessingTime(timeInSeconds);
        setResult(analysisResult);
        
        // Automatically show metrics after successful analysis
        setTimeout(() => {
          setShowMetrics(true);
          // Prevent body scroll when modal is open
          document.body.style.overflow = 'hidden';
        }, 500);
        
        const isFlagged = analysisResult.result.predictedClass === 1;
        const confidence = Math.max(analysisResult.result.probability0, analysisResult.result.probability1);
        
        toast.success(`${isFlagged ? '🚩' : '✅'} Analysis complete: ${isFlagged ? 'Flagged' : 'Not Flagged'} (${(confidence * 100).toFixed(1)}% confidence)`, {
          autoClose: 6000
        });
      } else {
        toast.error('No analysis result received');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setJustifications('');
    setResult(null);
    setShowMetrics(false);
    setProcessingTime(0);
  };

  // Close metrics modal
  const closeMetrics = () => {
    setShowMetrics(false);
    document.body.style.overflow = 'auto';
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showMetrics) {
        closeMetrics();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMetrics]);

  const styles = {
    container: {
      display: 'flex',
      gap: '2rem',
      minHeight: '70vh',
      flexWrap: 'wrap',
    },
    leftPanel: {
      flex: '2',
      minWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    },
    rightPanel: {
      flex: '1',
      minWidth: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    header: {
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #94a3b8 60%, #3b82f6 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
    },
    subtitle: {
      fontSize: '1rem',
      color: 'rgba(203, 213, 225, 0.8)',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    inputSection: {
      background: 'rgba(31, 41, 55, 0.4)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      height: 'fit-content',
    },
    inputLabel: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#e2e8f0',
      marginBottom: '1rem',
      display: 'block',
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '2px solid rgba(75, 85, 99, 0.4)',
      background: 'rgba(17, 24, 39, 0.6)',
      color: '#f1f5f9',
      fontSize: '1rem',
      lineHeight: '1.6',
      fontFamily: '"Inter", system-ui, sans-serif',
      resize: 'vertical',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)',
      outline: 'none',
      boxSizing: 'border-box',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem',
      flexWrap: 'wrap',
    },
    button: {
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      border: 'none',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      textTransform: 'capitalize',
      letterSpacing: '0.025em',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      flex: '1',
      minWidth: '140px',
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: '1px solid rgba(59, 130, 246, 0.4)',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    },
    buttonSecondary: {
      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white',
      border: '1px solid rgba(107, 114, 128, 0.4)',
      boxShadow: '0 4px 15px rgba(75, 85, 99, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    buttonDisabled: {
      background: 'rgba(55, 65, 81, 0.5)',
      color: 'rgba(255, 255, 255, 0.4)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
      border: '1px solid rgba(75, 85, 99, 0.3)',
    },
    resultSection: {
      background: 'rgba(31, 41, 55, 0.4)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      height: 'fit-content',
    },
    resultTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#e2e8f0',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    resultCard: {
      background: 'rgba(17, 24, 39, 0.6)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
    },
    resultBadge: {
      display: 'inline-block',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '0.85rem',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: '0.75rem',
      width: '100%',
      boxSizing: 'border-box',
    },
    resultBadgeFlagged: {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
    },
    resultBadgeNotFlagged: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
    },
    confidenceBar: {
      width: '100%',
      height: '0.5rem',
      background: 'rgba(55, 65, 81, 0.5)',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginTop: '0.375rem',
    },
    confidenceFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      borderRadius: '0.25rem',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    probabilities: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.75rem',
      marginTop: '1rem',
    },
    probability: {
      background: 'rgba(55, 65, 81, 0.5)',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      fontSize: '0.875rem',
      textAlign: 'center',
    },
    historySection: {
      background: 'rgba(31, 41, 55, 0.4)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      maxHeight: '500px',
      overflowY: 'auto',
      height: 'fit-content',
    },
    historyTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#e2e8f0',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    historyItem: {
      background: 'rgba(17, 24, 39, 0.6)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '0.75rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    historyText: {
      fontSize: '0.8rem',
      color: 'rgba(203, 213, 225, 0.9)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      marginBottom: '0.5rem',
      lineHeight: '1.4',
    },
    historyResult: {
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    emptyState: {
      color: 'rgba(203, 213, 225, 0.6)',
      fontSize: '0.9rem',
      textAlign: 'center',
      padding: '2rem 0',
      fontStyle: 'italic',
    },
    metricSection: {
      marginBottom: '1rem',
    },
    metricLabel: {
      fontSize: '0.8rem',
      fontWeight: '600',
      color: '#94a3b8',
      marginBottom: '0.375rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    metricValue: {
      fontSize: '0.85rem',
      color: '#e2e8f0',
      marginBottom: '0.75rem',
      background: 'rgba(31, 41, 55, 0.6)',
      padding: '0.5rem',
      borderRadius: '0.375rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      wordBreak: 'break-word',
      lineHeight: '1.4',
      maxHeight: '6rem',
      overflowY: 'auto',
      fontSize: '0.8rem',
    },
    confidenceSection: {
      marginTop: '1rem',
    },
    confidenceLabel: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: 'rgba(203, 213, 225, 0.8)',
      marginBottom: '0.5rem',
    },
    confidenceBar: {
      height: '8px',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'rgba(75, 85, 99, 0.4)',
    },
    confidenceFill: {
      height: '100%',
      borderRadius: '4px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    probabilitySection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginTop: '1rem',
    },
    probabilityItem: {
      background: 'rgba(17, 24, 39, 0.6)',
      borderRadius: '0.75rem',
      padding: '1rem',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    probabilityLabel: {
      fontSize: '0.9rem',
      fontWeight: '500',
      color: 'rgba(203, 213, 225, 0.8)',
    },
    probabilityValue: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#f1f5f9',
    },
    processingTime: {
      marginTop: '1rem',
      fontSize: '0.9rem',
      fontWeight: '500',
      color: 'rgba(203, 213, 225, 0.8)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    loadingPulse: {
      animation: 'pulse 1.5s infinite',
    },
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
        opacity: 1,
      },
      '50%': {
        transform: 'scale(1.05)',
        opacity: 0.7,
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
  };

  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .button-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
      
      .button-hover:active {
        transform: translateY(0px);
      }
      
      .history-item:hover {
        background: rgba(55, 65, 81, 0.6) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .textarea-focus:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.2) !important;
      }
      
      /* Seamless Metrics Modal Animations */
      .manual-metrics-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      
      .manual-metrics-overlay.show {
        opacity: 1;
        visibility: visible;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(12px);
      }
      
      .manual-metrics-modal {
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%);
        border-radius: 1.5rem;
        padding: 1.5rem;
        max-width: 500px;
        width: 100%;
        max-height: 70vh;
        overflow-y: auto;
        border: 1px solid rgba(59, 130, 246, 0.2);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
        transform: scale(0.8) translateY(50px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        color: white;
        margin: auto;
      }
      
      .manual-metrics-modal.show {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      
      .manual-metrics-close-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.75rem;
        color: #ef4444;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-weight: bold;
        z-index: 10;
        flex-shrink: 0;
      }
      
      .manual-metrics-close-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.1);
        border-color: rgba(239, 68, 68, 0.5);
      }
      
      .manual-metrics-content {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transition-delay: 0.2s;
        padding-right: 0.25rem;
        margin-top: 0.5rem;
      }
      
      .manual-metrics-content.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Better scrollbar for manual metrics modal */
      .manual-metrics-modal::-webkit-scrollbar {
        width: 4px;
      }
      
      .manual-metrics-modal::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.5);
        border-radius: 2px;
      }
      
      .manual-metrics-modal::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.4);
        border-radius: 2px;
      }
      
      .manual-metrics-modal::-webkit-scrollbar-thumb:hover {
        background: rgba(59, 130, 246, 0.6);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>✍️ Manual Analysis Input</h2>
        <p style={styles.subtitle}>
          Enter justification text for real-time AML analysis
        </p>
      </div>

      <div style={styles.inputSection}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            📝 Justifications
          </label>
          <textarea
            value={justifications}
            onChange={(e) => setJustifications(e.target.value)}
            placeholder="Enter the justification text for analysis..."
            style={styles.textarea}
            rows={8}
            disabled={loading}
          />
          <div style={styles.charCount}>
            {justifications.length} characters
          </div>
        </div>
      </div>

      <div style={styles.actionSection}>
        <button
          onClick={analyzeText}
          disabled={loading || !justifications.trim()}
          style={{
            ...styles.button,
            ...styles.buttonPrimary,
            ...(loading || !justifications.trim() ? styles.buttonDisabled : {})
          }}
          className={!loading ? "button-hover" : "loading-pulse"}
        >
          {loading ? '🔄 Analyzing...' : '🎯 Analyze Text'}
        </button>

        <button
          onClick={clearForm}
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            ...(loading ? styles.buttonDisabled : {})
          }}
          className={!loading ? "button-hover" : ""}
        >
          🗑️ Clear Form
        </button>

        {result && (
          <button
            onClick={() => setShowMetrics(true)}
            style={{
              ...styles.button,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
            className="button-hover"
          >
            📊 View Metrics
          </button>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div style={styles.resultSection} className="fade-in-up">
          <h3 style={styles.resultTitle}>📊 Analysis Result</h3>
          
          <div style={{
            ...styles.resultBadge,
            ...(result.result.predictedClass === 1 ? styles.resultBadgeFlagged : styles.resultBadgeNotFlagged)
          }}>
            {result.result.predictedClass === 1 ? '🚩 FLAGGED TRANSACTION' : '✅ LEGITIMATE TRANSACTION'}
          </div>

          <div style={styles.confidenceSection}>
            <div style={styles.confidenceLabel}>
              Confidence Level: {(Math.max(result.result.probability0, result.result.probability1) * 100).toFixed(2)}%
            </div>
            <div style={styles.confidenceBar}>
              <div
                style={{
                  ...styles.confidenceFill,
                  width: `${Math.max(result.result.probability0, result.result.probability1) * 100}%`
                }}
              />
            </div>
          </div>

          <div style={styles.probabilitySection}>
            <div style={styles.probabilityItem}>
              <span style={styles.probabilityLabel}>Not Flagged:</span>
              <span style={styles.probabilityValue}>
                {(result.result.probability0 * 100).toFixed(2)}%
              </span>
            </div>
            <div style={styles.probabilityItem}>
              <span style={styles.probabilityLabel}>Flagged:</span>
              <span style={styles.probabilityValue}>
                {(result.result.probability1 * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div style={styles.processingTime}>
            ⏱️ Processing Time: {processingTime.toFixed(2)} seconds
          </div>
        </div>
      )}

      {/* Automatic Metrics Modal - Fixed sizing */}
      {showMetrics && result && (
        <div 
          className={`manual-metrics-overlay ${showMetrics ? 'show' : ''}`}
          onClick={closeMetrics}
        >
          <div 
            className={`manual-metrics-modal ${showMetrics ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="manual-metrics-close-btn"
              onClick={closeMetrics}
              title="Close metrics (Press Escape)"
            >
              ×
            </button>
            
            <div className={`manual-metrics-content ${showMetrics ? 'show' : ''}`}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
                textAlign: 'center',
                paddingRight: '1.5rem',
              }}>
                📊 Analysis Metrics
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={styles.metricSection}>
                  <div style={styles.metricLabel}>Analysis Result</div>
                  <div style={{
                    ...styles.resultBadge,
                    ...(result.result.predictedClass === 1 ? styles.resultBadgeFlagged : styles.resultBadgeNotFlagged)
                  }}>
                    {result.result.predictedClass === 1 ? '🚩 FLAGGED' : '✅ NOT FLAGGED'}
                  </div>
                </div>

                <div style={styles.metricSection}>
                  <div style={styles.metricLabel}>Confidence Level</div>
                  <div style={styles.metricValue}>
                    {(Math.max(result.result.probability0, result.result.probability1) * 100).toFixed(2)}%
                    <div style={styles.confidenceBar}>
                      <div
                        style={{
                          ...styles.confidenceFill,
                          width: `${Math.max(result.result.probability0, result.result.probability1) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.metricSection}>
                  <div style={styles.metricLabel}>Probability Breakdown</div>
                  <div style={styles.metricValue}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Not Flagged:</strong> {(result.result.probability0 * 100).toFixed(2)}%
                    </div>
                    <div>
                      <strong>Flagged:</strong> {(result.result.probability1 * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div style={styles.metricSection}>
                  <div style={styles.metricLabel}>Processing Time</div>
                  <div style={styles.metricValue}>
                    {processingTime.toFixed(2)} seconds
                  </div>
                </div>

                <div style={styles.metricSection}>
                  <div style={styles.metricLabel}>Justifications</div>
                  <div style={styles.metricValue}>
                    {justifications || 'N/A'}
                  </div>
                </div>

                {result.rawOutput && (
                  <div style={styles.metricSection}>
                    <div style={styles.metricLabel}>Raw AI Response</div>
                    <div style={{...styles.metricValue, fontSize: '0.8rem', fontFamily: 'monospace'}}>
                      {result.rawOutput}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualInput;
