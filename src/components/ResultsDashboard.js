import React from 'react';

const ResultsDashboard = ({ results }) => {
  console.log('ResultsDashboard received results:', results);

  const getClassificationText = (predictedClass) => {
    if (predictedClass === 1) return 'Suspicious';
    if (predictedClass === 0) return 'Non-Suspicious';
    if (predictedClass === -1) return 'Processing...';
    return 'Unknown';
  };

  const getClassificationColor = (predictedClass) => {
    if (predictedClass === 1) return '#ef4444'; // red
    if (predictedClass === 0) return '#10b981'; // green
    if (predictedClass === -1) return '#f59e0b'; // yellow
    return '#6b7280'; // gray
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#5eead4',
      marginBottom: '1rem',
    },
    resultCard: {
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #4b5563',
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    resultId: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#e5e7eb',
    },
    classificationBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'white',
    },
    probabilities: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginTop: '0.75rem',
    },
    probabilityItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    probabilityLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af',
    },
    probabilityValue: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#e5e7eb',
    },
    processingTime: {
      fontSize: '0.75rem',
      color: '#6b7280',
      marginTop: '0.5rem',
    },
    justificationPreview: {
      fontSize: '0.875rem',
      color: '#d1d5db',
      marginTop: '0.5rem',
      maxHeight: '3rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Analysis Results ({results.length} items)</h2>
      
      {results.map((result, index) => {
        console.log(`Result ${index}:`, result);
        
        // Extract values with multiple fallback options
        const predictedClass = result.result?.predictedClass ?? 
                              result.result?.['Predicted Class'] ?? 
                              result.predictedClass ?? 0;
        
        const probability0 = result.result?.probability0 ?? 
                            result.result?.['Probability[0]'] ?? 
                            result.probability0 ?? 0.5;
        
        const probability1 = result.result?.probability1 ?? 
                            result.result?.['Probability[1]'] ?? 
                            result.probability1 ?? 0.5;

        console.log(`Result ${index} extracted values:`, { predictedClass, probability0, probability1 });

        return (
          <div key={result.id || index} style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <span style={styles.resultId}>ID: {result.id}</span>
              <span 
                style={{
                  ...styles.classificationBadge,
                  backgroundColor: getClassificationColor(predictedClass),
                }}
              >
                {getClassificationText(predictedClass)}
              </span>
            </div>
            
            <div style={styles.probabilities}>
              <div style={styles.probabilityItem}>
                <span style={styles.probabilityLabel}>Non-Suspicious Probability</span>
                <span style={styles.probabilityValue}>
                  {isNaN(probability0) ? 'N/A' : `${(probability0 * 100).toFixed(1)}%`}
                </span>
              </div>
              <div style={styles.probabilityItem}>
                <span style={styles.probabilityLabel}>Suspicious Probability</span>
                <span style={styles.probabilityValue}>
                  {isNaN(probability1) ? 'N/A' : `${(probability1 * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>
            
            {result.justificationMaker && (
              <div style={styles.justificationPreview}>
                <strong>Maker:</strong> {result.justificationMaker.substring(0, 150)}...
              </div>
            )}
            
            {result.justificationChecker && (
              <div style={styles.justificationPreview}>
                <strong>Checker:</strong> {result.justificationChecker.substring(0, 150)}...
              </div>
            )}
            
            {result.processingTime && (
              <div style={styles.processingTime}>
                Processing time: {result.processingTime.toFixed(2)}s
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResultsDashboard;
