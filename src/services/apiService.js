// Azure AI Configuration - using your provided credentials
const AZURE_CONFIG = {
  endpoint: process.env.REACT_APP_AZURE_AI_ENDPOINT || "https://project-aml-final.services.ai.azure.com/api/projects/project-aml-final",
  agentId: process.env.REACT_APP_AZURE_AI_AGENT_ID || "asst_Lqv3j9peBP9VkIEAeCZL9Bpb",
  apiVersion: process.env.REACT_APP_AZURE_AI_API_VERSION || "2023-12-01-preview",
  apiKey: process.env.REACT_APP_AZURE_AI_API_KEY || "",
  logicAppUrl: process.env.REACT_APP_LOGIC_APP_URL || "https://prod-72.westus.logic.azure.com:443/workflows/c1a88cfb82be4b13a87903021e57972d/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=hIqAmWy311NV3KyIJK-UygnjyEyQCbqJSD7JdJa2CtU"
};

// Helper function to create error response
const createErrorResponse = (row, errorMsg, processingTime) => {
  return {
    id: row.id,
    justificationMaker: row.justificationMaker,
    justificationChecker: row.justificationChecker,
    result: {
      predictedClass: 0,
      probability0: 0.5,
      probability1: 0.5
    },
    rawOutput: `Error: ${errorMsg}`,
    processingTime: processingTime,
    error: errorMsg
  };
};

// Helper function to parse AI response (replicates Go regex parsing)
const parseAIResponse = (responseText, rowId) => {
  console.log(`🔍 Row ${rowId}: Parsing AI response:`, responseText.substring(0, 200));
  
  // Priority 1: Sandwiched format parsing - exact same regex as Go backend
  const sandwichPattern = /#9&7!\[([0-9]+),([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)\]#9&7!/;
  const matches = responseText.match(sandwichPattern);
  
  if (matches && matches.length >= 4) {
    console.log(`🎯 Row ${rowId}: Found sandwiched format:`, matches[0]);
    
    const result = {
      predictedClass: parseInt(matches[1], 10),
      probability0: parseFloat(matches[2]),
      probability1: parseFloat(matches[3])
    };
    
    console.log(`✅ Row ${rowId}: Parsed result:`, result);
    return result;
  }
  
  // Try Logic App format (same as Go backend)
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
            
            console.log(`✅ Row ${rowId}: Parsed Logic App result:`, result);
            return result;
          }
        }
      }
    }
  } catch (e) {
    console.log(`⚠️ Row ${rowId}: Not JSON format, continuing with other parsing methods`);
  }
  
  // Default fallback (same as Go backend)
  console.log(`⚠️ Row ${rowId}: Could not parse response, using default values`);
  return {
    predictedClass: 0,
    probability0: 0.5,
    probability1: 0.5
  };
};

// Process a single row with retry logic (replicates Go goroutine logic)
const processRow = async (row, onProgress) => {
  const startTime = Date.now();
  
  // Send start notification
  if (onProgress) {
    onProgress({
      type: 'row_start',
      id: row.id
    });
  }
  
  // Combine justification texts (same logic as Go backend)
  let justificationText = '';
  if (row.justificationMaker && row.justificationChecker) {
    justificationText = `Maker Justification: ${row.justificationMaker}\n\nChecker Justification: ${row.justificationChecker}`;
  } else if (row.justificationMaker) {
    justificationText = row.justificationMaker;
  } else {
    justificationText = row.justificationChecker;
  }
  
  if (!justificationText) {
    const response = {
      id: row.id,
      justificationMaker: row.justificationMaker,
      justificationChecker: row.justificationChecker,
      result: {
        predictedClass: 0,
        probability0: 1.0,
        probability1: 0.0
      },
      rawOutput: 'No justification text provided',
      processingTime: (Date.now() - startTime) / 1000
    };
    
    if (onProgress) {
      onProgress({
        type: 'row_complete',
        data: response
      });
    }
    
    return response;
  }
  
  // Check if Logic App URL is configured
  if (!AZURE_CONFIG.logicAppUrl) {
    const errorResponse = createErrorResponse(row, 'Logic App URL not configured', (Date.now() - startTime) / 1000);
    
    if (onProgress) {
      onProgress({
        type: 'row_error',
        data: errorResponse
      });
    }
    
    return errorResponse;
  }
  
  // Retry logic (same as Go backend: maxRetries = 3)
  const maxRetries = 3;
  let finalResponse = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`🔄 Row ${row.id}: Retry attempt ${attempt}/${maxRetries}`);
      
      if (onProgress) {
        onProgress({
          type: 'row_retry',
          id: row.id,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        });
      }
      
      // Progressive delay for retries (same as Go backend: attempt * 10 seconds)
      await new Promise(resolve => setTimeout(resolve, attempt * 10000));
    }
    
    try {
      console.log(`📤 Row ${row.id}: Sending request (length: ${justificationText.length}) - Attempt ${attempt + 1}`);
      
      const requestBody = {
        message: justificationText
      };
      
      console.log(`📋 Row ${row.id}: Request payload structure:`, {
        type: "object", 
        properties: { message: { type: "string", value: justificationText.substring(0, 100) + "..." } }
      });
      
      // Create fetch request with same timeout as Go backend (600 seconds = 10 minutes)
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
      
      console.log(`📥 Row ${row.id}: Received response (attempt ${attempt + 1}): Status ${response.status}, Length ${responseText.length}`);
      
      // Check for server errors that should be retried (same logic as Go backend)
      if (response.status >= 500 || response.status === 429) {
        console.log(`⚠️ Row ${row.id}: Server error ${response.status} (attempt ${attempt + 1}), will retry`);
        if (attempt === maxRetries) {
          finalResponse = createErrorResponse(row, `Server error ${response.status} after ${maxRetries + 1} attempts`, (Date.now() - startTime) / 1000);
        }
        continue;
      }
      
      // Check for other HTTP errors (don't retry client errors)
      if (!response.ok && response.status !== 202) {
        console.log(`❌ Row ${row.id}: HTTP ${response.status} (final)`);
        finalResponse = createErrorResponse(row, `HTTP ${response.status}`, (Date.now() - startTime) / 1000);
        break; // Don't retry client errors
      }
      
      // Handle 202 Accepted (same as Go backend)
      if (response.status === 202) {
        console.log(`⏳ Row ${row.id}: Analysis in progress (202 Accepted)`);
        finalResponse = {
          id: row.id,
          justificationMaker: row.justificationMaker,
          justificationChecker: row.justificationChecker,
          result: {
            predictedClass: -1,
            probability0: 0.0,
            probability1: 0.0
          },
          rawOutput: 'Processing: Request accepted by Logic App',
          processingTime: (Date.now() - startTime) / 1000
        };
        
        if (onProgress) {
          onProgress({
            type: 'row_processing',
            data: finalResponse
          });
        }
        
        return finalResponse;
      }
      
      // Success! Process the response (same parsing logic as Go backend)
      const result = parseAIResponse(responseText, row.id);
      
      finalResponse = {
        id: row.id,
        justificationMaker: row.justificationMaker,
        justificationChecker: row.justificationChecker,
        result: result,
        rawOutput: responseText,
        processingTime: (Date.now() - startTime) / 1000
      };
      
      console.log(`✅ Row ${row.id}: Class=${result.predictedClass}, P0=${(result.probability0 * 100).toFixed(1)}%, P1=${(result.probability1 * 100).toFixed(1)}% (${finalResponse.processingTime.toFixed(2)}s) - Success after ${attempt + 1} attempts`);
      
      if (onProgress) {
        onProgress({
          type: 'row_complete',
          data: finalResponse
        });
      }
      
      return finalResponse;
      
    } catch (error) {
      console.log(`❌ Row ${row.id}: Request error (attempt ${attempt + 1}):`, error.message);
      if (attempt === maxRetries) {
        finalResponse = createErrorResponse(row, `Request error after ${maxRetries + 1} attempts: ${error.message}`, (Date.now() - startTime) / 1000);
      }
      continue;
    }
  }
  
  // Send error response if we got here
  if (onProgress) {
    onProgress({
      type: 'row_error',
      data: finalResponse
    });
  }
  
  return finalResponse;
};

// Main streaming analysis function (replicates Go handleAnalyzeStream)
export const analyzeRowsStream = async (rows, onProgress) => {
  console.log(`🔄 Starting integrated streaming analysis for ${rows.length} rows`);
  
  // Send initial status (same as Go backend)
  if (onProgress) {
    onProgress({
      type: 'status',
      message: `Starting analysis for ${rows.length} rows`
    });
  }
  
  // Filter selected rows
  const selectedRows = rows.filter(row => row.selected);
  console.log(`📊 Processing ${selectedRows.length} selected rows`);
  
  // Process rows with controlled concurrency (same as Go backend: semaphore with 5 slots)
  const concurrencyLimit = 5;
  const results = [];
  
  // Create promises for all rows with staggered delays (replicates Go backend staggering)
  const processWithStaggering = async () => {
    const promises = selectedRows.map(async (row, index) => {
      // Add staggered delay (same as Go backend: 1000ms per row)
      const delay = index * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return processRow(row, onProgress);
    });
    
    // Process with concurrency control
    const processInBatches = async (promises, batchSize) => {
      const results = [];
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
      }
      return results;
    };
    
    return await processInBatches(promises, concurrencyLimit);
  };
  
  const allResults = await processWithStaggering();
  results.push(...allResults);
  
  // Send completion message (same as Go backend)
  if (onProgress) {
    onProgress({
      type: 'complete',
      message: `Analysis complete for ${selectedRows.length} rows`
    });
  }
  
  console.log(`🏁 Integrated streaming analysis complete for ${selectedRows.length} rows`);
  return results;
};

// Batch analysis function (replicates Go handleAnalyze)
export const analyzeRows = async (rows) => {
  console.log(`🔄 Starting batch analysis for ${rows.length} rows`);
  
  const selectedRows = rows.filter(row => row.selected);
  const results = [];
  
  // Process with same concurrency as Go backend (5 concurrent requests)
  const concurrencyLimit = 5;
  
  for (let i = 0; i < selectedRows.length; i += concurrencyLimit) {
    const batch = selectedRows.slice(i, i + concurrencyLimit);
    
    const batchPromises = batch.map(row => processRow(row));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  console.log(`🏁 Batch analysis complete for ${selectedRows.length} rows`);
  return results;
};

export default {
  analyzeRowsStream,
  analyzeRows
};
