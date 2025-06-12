import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const MetricsDashboard = ({ results }) => {
  console.log('MetricsDashboard received results:', results);

  // Calculate metrics from results
  const calculateMetrics = () => {
    const validResults = results.filter(r => {
      const predictedClass = r.result?.predictedClass ?? r.result?.['Predicted Class'] ?? 0;
      return predictedClass !== -1; // Exclude processing results
    });

    const suspiciousCount = validResults.filter(r => {
      const predictedClass = r.result?.predictedClass ?? r.result?.['Predicted Class'] ?? 0;
      return predictedClass === 1;
    }).length;

    const nonSuspiciousCount = validResults.filter(r => {
      const predictedClass = r.result?.predictedClass ?? r.result?.['Predicted Class'] ?? 0;
      return predictedClass === 0;
    }).length;

    const avgProcessingTime = validResults.length > 0 
      ? validResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / validResults.length 
      : 0;

    const avgProbability0 = validResults.length > 0
      ? validResults.reduce((sum, r) => {
          const prob0 = r.result?.probability0 ?? r.result?.['Probability[0]'] ?? 0.5;
          return sum + prob0;
        }, 0) / validResults.length
      : 0.5;

    const avgProbability1 = validResults.length > 0
      ? validResults.reduce((sum, r) => {
          const prob1 = r.result?.probability1 ?? r.result?.['Probability[1]'] ?? 0.5;
          return sum + prob1;
        }, 0) / validResults.length
      : 0.5;

    return {
      total: results.length,
      analyzed: validResults.length,
      processing: results.length - validResults.length,
      suspicious: suspiciousCount,
      nonSuspicious: nonSuspiciousCount,
      suspiciousRate: validResults.length > 0 ? (suspiciousCount / validResults.length) * 100 : 0,
      avgProcessingTime,
      avgProbability0: avgProbability0 * 100,
      avgProbability1: avgProbability1 * 100,
    };
  };

  const metrics = calculateMetrics();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: ' '1.5rem',
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#5eead4',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    },
    metricCard: {
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      border: '1px solid #4b5563',
      textAlign: 'center',
    },
    metricValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#e5e7eb',
      display: 'block',
    },
    metricLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginTop: '0.5rem',
    },
    suspicious: {
      color: '#ef4444',
    },
    nonSuspicious: {
      color: '#10b981',
    },
    processing: {
      color: '#f59e0b',
    },
  };

  console.log('Calculated metrics:', metrics);

  const doughnutChartRef = useRef(null);
  const doughnutChart = useRef(null);
  const barChartRef = useRef(null);
  const barChart = useRef(null);
  const histogramChartRef = useRef(null);
  const histogramChart = useRef(null);

  useEffect(() => {
    if (!results || results.length === 0) return;

    // Count flagged vs. not flagged
    const flaggedCount = results.filter(r => r.result?.['Predicted Class'] === 1).length;
    const notFlaggedCount = results.length - flaggedCount;

    // Create distribution of probabilities
    const probabilities = results.map(r => r.result?.['Probability[1]'] || 0);
    
    // Calculate metrics for risk buckets
    const highRiskCount = results.filter(r => r.result?.['Probability[1]'] >= 0.7).length;
    const mediumRiskCount = results.filter(r => {
      const prob = r.result?.['Probability[1]'];
      return prob >= 0.5 && prob < 0.7;
    }).length;
    const lowRiskCount = results.filter(r => r.result?.['Probability[1]'] < 0.5).length;

    // Create histogram data
    const histogramBuckets = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const histogramCounts = Array(histogramBuckets.length - 1).fill(0);
    
    probabilities.forEach(prob => {
      for (let i = 0; i < histogramBuckets.length - 1; i++) {
        if (prob >= histogramBuckets[i] && prob < histogramBuckets[i + 1]) {
          histogramCounts[i]++;
          break;
        }
        // Handle exactly 1.0
        if (i === histogramBuckets.length - 2 && prob === 1.0) {
          histogramCounts[i]++;
        }
      }
    });

    // Doughnut Chart for Flagged vs Not Flagged
    if (doughnutChartRef.current) {
      if (doughnutChart.current) {
        doughnutChart.current.destroy();
      }

      const ctx = doughnutChartRef.current.getContext('2d');
      doughnutChart.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Flagged', 'Not Flagged'],
          datasets: [{
            data: [flaggedCount, notFlaggedCount],
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(34, 197, 94, 0.8)'
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(34, 197, 94)'
            ],
            borderWidth: 1,
            hoverOffset: 5
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'rgb(209, 213, 219)',
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Flagged vs Not Flagged',
              color: 'rgb(209, 213, 219)',
              font: {
                size: 16
              }
            }
          },
          cutout: '70%',
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      });
    }

    // Bar Chart for Risk Categories
    if (barChartRef.current) {
      if (barChart.current) {
        barChart.current.destroy();
      }

      const ctx = barChartRef.current.getContext('2d');
      barChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['High Risk', 'Medium Risk', 'Low Risk'],
          datasets: [{
            label: 'Number of Cases',
            data: [highRiskCount, mediumRiskCount, lowRiskCount],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(234, 179, 8, 0.7)',
              'rgba(34, 197, 94, 0.7)'
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(234, 179, 8)',
              'rgb(34, 197, 94)'
            ],
            borderWidth: 1,
            borderRadius: 5,
            hoverBackgroundColor: [
              'rgba(239, 68, 68, 0.9)',
              'rgba(234, 179, 8, 0.9)',
              'rgba(34, 197, 94, 0.9)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Risk Distribution',
              color: 'rgb(209, 213, 219)',
              font: {
                size: 16
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              },
              ticks: {
                color: 'rgb(209, 213, 219)'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgb(209, 213, 219)'
              }
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeOutQuart'
          }
        }
      });
    }

    // Histogram Chart for Probability Distribution
    if (histogramChartRef.current) {
      if (histogramChart.current) {
        histogramChart.current.destroy();
      }

      const ctx = histogramChartRef.current.getContext('2d');
      histogramChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: histogramBuckets.slice(0, -1).map((val, i) => `${Math.round(val * 100)}-${Math.round(histogramBuckets[i+1] * 100)}%`),
          datasets: [{
            label: 'Number of Cases',
            data: histogramCounts,
            backgroundColor: Array(histogramCounts.length).fill().map((_, i) => {
              const colorValue = Math.min(255, Math.round(255 * (i / (histogramCounts.length - 1))));
              return `rgba(${255 - colorValue}, ${colorValue}, 50, 0.7)`;
            }),
            borderColor: Array(histogramCounts.length).fill().map((_, i) => {
              const colorValue = Math.min(255, Math.round(255 * (i / (histogramCounts.length - 1))));
              return `rgb(${255 - colorValue}, ${colorValue}, 50)`;
            }),
            borderWidth: 1,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Probability Distribution',
              color: 'rgb(209, 213, 219)',
              font: {
                size: 16
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(107, 114, 128, 0.2)'
              },
              ticks: {
                color: 'rgb(209, 213, 219)'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgb(209, 213, 219)',
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeOutQuart'
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (doughnutChart.current) {
        doughnutChart.current.destroy();
      }
      if (barChart.current) {
        barChart.current.destroy();
      }
      if (histogramChart.current) {
        histogramChart.current.destroy();
      }
    };
  }, [results]);

  // Calculate summary statistics
  const totalCases = results.length;
  const flaggedCount = results.filter(r => r.result?.['Predicted Class'] === 1).length;
  const flaggedPercentage = totalCases > 0 ? Math.round((flaggedCount / totalCases) * 100) : 0;
  
  // Calculate average probability
  const avgProbability = results.length > 0 
    ? results.reduce((sum, r) => sum + (r.result?.['Probability[1]'] || 0), 0) / results.length
    : 0;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-cyan-300">Metrics Dashboard</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-blue-900 to-blue-700 p-6 rounded-lg">
          <h3 className="text-blue-200 text-sm font-medium">Total Cases</h3>
          <p className="text-white text-3xl font-bold mt-2">{totalCases}</p>
        </div>
        
        <div className="card bg-gradient-to-r from-purple-900 to-purple-700 p-6 rounded-lg">
          <h3 className="text-purple-200 text-sm font-medium">Flagged Cases</h3>
          <div className="flex items-end">
            <p className="text-white text-3xl font-bold mt-2">{flaggedCount}</p>
            <p className="text-purple-200 text-sm ml-2 mb-1">({flaggedPercentage}%)</p>
          </div>
        </div>
        
        <div className="card bg-gradient-to-r from-teal-900 to-teal-700 p-6 rounded-lg">
          <h3 className="text-teal-200 text-sm font-medium">Average Risk Score</h3>
          <p className="text-white text-3xl font-bold mt-2">{Math.round(avgProbability * 100)}%</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="h-64">
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>
        
        <div className="card bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="h-64">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
        
        <div className="card bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="h-64">
            <canvas ref={histogramChartRef}></canvas>
          </div>
        </div>
      </div>
      
      {/* No data message */}
      {results.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium">No data available</h3>
          <p className="mt-1">Run an analysis first to see metrics and visualizations.</p>
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;
