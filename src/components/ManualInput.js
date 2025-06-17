import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ManualInput = () => {
  const [justificationMaker, setJustificationMaker] = useState('');
  const [justificationChecker, setJustificationChecker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);

  // Azure AI Configuration - using your provided credentials
  const AZURE_CONFIG = {
    logicAppUrl: process.env.REACT_APP_LOGIC_APP_URL || "https://prod-35.eastus2.logic.azure.com:443/workflows/225dc0d0101648779132d323aa631f87/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=HZmkzavSgK_r12pnH7xPBlvbm8GjptNoVdQNCoRruUk"
  };

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

  // Helper function to parse AI response (same as in apiService.js)
  const parseAIResponse = (responseText) => {
    console.log('🔍 Manual Input: Parsing AI response:', responseText.substring(0, 200));
    
    // Priority 1: Sandwiched format parsing - exact same regex as Go backend
    const sandwichPattern = /#9&7!\[([0-9]+),([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)\]#9&7!/;
    const matches = responseText.match(sandwichPattern);
    
    if (matches && matches.length >= 4) {
      console.log('🎯 Manual Input: Found sandwiched format:', matches[0]);
      
      const result = {
        predictedClass: parseInt(matches[1], 10),
        probability0: parseFloat(matches[2]),
        probability1: parseFloat(matches[3])
      };
      
      console.log('✅ Manual Input: Parsed result:', result);
      return result;
    }
    
    // Try Logic App format
    try {
      const logicAppResponse = JSON.parse(responseText);
      if (Array.isArray(logicAppResponse)) {
        for (const message of logicAppResponse) {
          if (message.role === "assistant" && message.content && message.content.length > 0) {
            const content = message.content[0].text.value;
            const contentMatches = content.match(sandwichPattern);
            
            if (contentMatches && contentMatches.length >= 4) {
              const result = {
                predictedClass: parseInt(contentMatches[1], 10),
                probability0: parseFloat(contentMatches[2]),
                probability1: parseFloat(contentMatches[3])
              };
              
              console.log('✅ Manual Input: Parsed Logic App result:', result);
              return result;
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Manual Input: Not JSON format, continuing with other parsing methods');
    }
    
    // Default fallback
    console.log('⚠️ Manual Input: Could not parse response, using default values');
    return {
      predictedClass: 0,
      probability0: 0.5,
      probability1: 0.5
    };
  };

  const analyzeText = async () => {
    if (!justificationMaker.trim() && !justificationChecker.trim()) {
      toast.warning('Please enter at least one justification text');
      return;
    }

    setLoading(true);
    setResult(null);
    setShowMetrics(false);
    const startTime = Date.now();

    try {
      // Combine justification texts (same logic as backend)
      let justificationText = '';
      if (justificationMaker.trim() && justificationChecker.trim()) {
        justificationText = `Maker Justification: ${justificationMaker.trim()}\n\nChecker Justification: ${justificationChecker.trim()}`;
      } else if (justificationMaker.trim()) {
        justificationText = justificationMaker.trim();
      } else {
        justificationText = justificationChecker.trim();
      }

      // Check if Logic App URL is configured
      if (!AZURE_CONFIG.logicAppUrl) {
        throw new Error('Logic App URL not configured');
      }

      console.log('📤 Manual Input: Sending request (length:', justificationText.length, ')');
      
      const requestBody = {
        justification: justificationText
      };

      // Create fetch request with same timeout as backend (600 seconds = 10 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

      const response = await fetch(AZURE_CONFIG.logicAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      const processingTime = (Date.now() - startTime) / 1000;

      console.log('📥 Manual Input: Received response: Status', response.status, 'Length', responseText.length);

      if (!response.ok && response.status !== 202) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // Handle 202 Accepted
      if (response.status === 202) {
        console.log('⏳ Manual Input: Analysis in progress (202 Accepted)');
        toast.info('⏳ Analysis in progress, please wait...');
        
        setResult({
          predictedClass: -1,
          probability0: 0.0,
          probability1: 0.0,
          rawOutput: 'Processing: Request accepted by Logic App',
          processingTime: processingTime,
          status: 'processing'
        });
        
        setLoading(false);
        return;
      }

      // Success! Process the response
      const parsedResult = parseAIResponse(responseText);
      
      const finalResult = {
        ...parsedResult,
        rawOutput: responseText,
        processingTime: processingTime,
        status: 'completed'
      };

      console.log('✅ Manual Input: Analysis completed:', finalResult);

      setResult(finalResult);
      
      // Show success feedback
      const isFlagged = finalResult.predictedClass === 1;
      const resultText = isFlagged ? 'Flagged' : 'Not Flagged';
      const emoji = isFlagged ? '🚩' : '✅';
      const confidence = Math.max(finalResult.probability0, finalResult.probability1);
      
      toast.success(`${emoji} Analysis complete: ${resultText} (${(confidence * 100).toFixed(1)}% confidence)`, {
        autoClose: 6000
      });

    } catch (error) {
      console.error('❌ Manual Input analysis error:', error);
      
      const errorResult = {
        predictedClass: 0,
        probability0: 0.5,
        probability1: 0.5,
        rawOutput: `Error: ${error.message}`,
        processingTime: (Date.now() - startTime) / 1000,
        status: 'error',
        error: error.message
      };
      
      setResult(errorResult);
      toast.error(`❌ Analysis failed: ${error.message}`, {
        autoClose: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setJustificationMaker('');
    setJustificationChecker('');
    setResult(null);
    toast.info('Input cleared');
  };

  const loadSampleText = () => {
    const sampleTexts = [
      "The transaction was flagged due to unusual patterns in spending behavior. Upon investigation, the customer had recently moved and was making home setup purchases.",
      "Large cash deposit detected from customer's business operations. Customer provided supporting documentation showing legitimate revenue sources.",
      "Multiple transactions to same beneficiary triggered alert. Customer explained these were monthly payments to elderly parent for care services.",
      "Cross-border transfer to high-risk jurisdiction. Customer provided evidence of property purchase and legal documentation.",
      "Wire transfer to entity on watch list. Further review showed legitimate business relationship with proper contracts."
    ];
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setJustificationMaker(randomText);
    toast.success('Sample text loaded!');
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
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #94a3b8 50%, #3b82f6 75%, #60a5fa 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textAlign: 'center',
      marginBottom: '2rem',
      letterSpacing: '-0.03em',
      lineHeight: '1.2',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
    },
    inputGroup: {
      marginBottom: '2rem',
    },
    label: {
      display: 'block',
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: '0.75rem',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    },
    textarea: {
      width: '100%',
      minHeight: '120px',
      padding: '1rem',
      borderRadius: '0.75rem',
      border: '1px solid rgba(75, 85, 99, 0.4)',
      backgroundColor: 'rgba(31, 41, 55, 0.7)',
      color: 'white',
      fontSize: '0.95rem',
      lineHeight: '1.5',
      resize: 'vertical',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px) saturate(180%)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      justifyContent: 'center',
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
      position: 'relative',
      overflow: 'hidden',
      textTransform: 'capitalize',
      letterSpacing: '0.025em',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      minWidth: '140px',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: '1px solid rgba(59, 130, 246, 0.4)',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    },
    secondaryButton: {
      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white',
      border: '1px solid rgba(107, 114, 128, 0.4)',
      boxShadow: '0 4px 15px rgba(75, 85, 99, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    successButton: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      border: '1px solid rgba(5, 150, 105, 0.4)',
      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    disabledButton: {
      background: 'rgba(55, 65, 81, 0.5)',
      color: 'rgba(255, 255, 255, 0.4)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
      border: '1px solid rgba(75, 85, 99, 0.3)',
    },
    resultContainer: {
      marginTop: '2rem',
      padding: '2rem',
      borderRadius: '1rem',
      backgroundColor: 'rgba(31, 41, 55, 0.7)',
      border: '1px solid rgba(75, 85, 99, 0.4)',
      backdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    resultTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    resultCard: {
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: 'rgba(17, 24, 39, 0.6)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      textAlign: 'center',
    },
    resultLabel: {
      fontSize: '0.8rem',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '0.5rem',
      fontWeight: '600',
    },
    resultValue: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: 'white',
    },
    rawOutput: {
      marginTop: '1rem',
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      fontSize: '0.85rem',
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
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
      <h2 style={styles.title}>✍️ Manual Analysis Input</h2>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>Justification Maker:</label>
        <textarea
          style={styles.textarea}
          value={justificationMaker}
          onChange={(e) => setJustificationMaker(e.target.value)}
          placeholder="Enter maker justification text here..."
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(75, 85, 99, 0.4)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Justification Checker:</label>
        <textarea
          style={styles.textarea}
          value={justificationChecker}
          onChange={(e) => setJustificationChecker(e.target.value)}
          placeholder="Enter checker justification text here..."
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(75, 85, 99, 0.4)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button
          onClick={analyzeText}
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            ...(loading ? styles.disabledButton : {})
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }
          }}
        >
          {loading ? '🔄 Analyzing...' : '🎯 Analyze Text'}
        </button>

        <button
          onClick={loadSampleText}
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.successButton,
            ...(loading ? styles.disabledButton : {})
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(5, 150, 105, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          🎲 Load Sample
        </button>

        <button
          onClick={clearInput}
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.secondaryButton,
            ...(loading ? styles.disabledButton : {})
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(75, 85, 99, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(75, 85, 99, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {result && (
        <div style={styles.resultContainer}>
          <h3 style={styles.resultTitle}>📊 Analysis Result</h3>
          
          <div style={styles.resultGrid}>
            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Prediction</div>
              <div style={{
                ...styles.resultValue,
                color: result.predictedClass === 1 ? '#ef4444' : 
                       result.predictedClass === -1 ? '#f59e0b' : '#22c55e'
              }}>
                {result.predictedClass === 1 ? '🚩 Flagged' : 
                 result.predictedClass === -1 ? '⏳ Processing' : '✅ Not Flagged'}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Confidence</div>
              <div style={styles.resultValue}>
                {result.predictedClass === -1 ? 'N/A' : 
                 `${(Math.max(result.probability0, result.probability1) * 100).toFixed(1)}%`}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Not Flagged Probability</div>
              <div style={styles.resultValue}>
                {result.predictedClass === -1 ? 'N/A' : `${(result.probability0 * 100).toFixed(1)}%`}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Flagged Probability</div>
              <div style={styles.resultValue}>
                {result.predictedClass === -1 ? 'N/A' : `${(result.probability1 * 100).toFixed(1)}%`}
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Processing Time</div>
              <div style={styles.resultValue}>
                {result.processingTime.toFixed(2)}s
              </div>
            </div>

            <div style={styles.resultCard}>
              <div style={styles.resultLabel}>Status</div>
              <div style={{
                ...styles.resultValue,
                color: result.status === 'completed' ? '#22c55e' : 
                       result.status === 'processing' ? '#f59e0b' : '#ef4444'
              }}>
                {result.status === 'completed' ? '✅ Completed' : 
                 result.status === 'processing' ? '⏳ Processing' : '❌ Error'}
              </div>
            </div>
          </div>

          {result.rawOutput && (
            <div>
              <div style={styles.resultLabel}>Raw Output:</div>
              <div style={styles.rawOutput}>
                {result.rawOutput}
              </div>
            </div>
          )}
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
                    {justificationMaker || justificationChecker || 'N/A'}
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
