import React, { useEffect, useState, useRef } from 'react';
import './DomainDetails.css';

const DomainDetails = () => {
  const [domainDetails, setDomainDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Fetching domain insights...");
  const [isRealTimeUpdate, setIsRealTimeUpdate] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const wsRef = useRef(null);
  const domainNameRef = useRef(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = (taskId, domainName) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/${taskId}`);
    wsRef.current = ws;
    domainNameRef.current = domainName;

    ws.onopen = () => {
      console.log('WebSocket connected for domain details');
      setConnectionStatus('connected');
      setIsRealTimeUpdate(true);
      setLoadingMessage("Waiting for real-time description...");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message in details:', message);

        switch (message.type) {
          case 'domain_update':
            const domainData = message.data;
            const domainKey = domainData.domainName.replace('.lk', '');
            
            // Check if this update is for our current domain
            if (domainKey === domainName || domainData.domainName === `${domainName}.lk`) {
              console.log("Received real-time update for our domain:", domainData);
              setDomainDetails(domainData);
              setLoading(false);
              setIsRealTimeUpdate(true);
              
              // Cache the description
              sessionStorage.setItem("domainDescription", JSON.stringify(domainData));
            }
            break;

          case 'completed':
            console.log('All domain descriptions completed');
            setConnectionStatus('completed');
            // If we still don't have details, try to fetch them
            if (!domainDetails) {
              fetchBackgroundDescriptions();
            }
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      setIsRealTimeUpdate(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      setIsRealTimeUpdate(false);
    };
  };

  // Fetch background descriptions when WebSocket completes
  const fetchBackgroundDescriptions = async () => {
    const taskId = sessionStorage.getItem("taskId");
    const domainName = sessionStorage.getItem("selectedDomain");
    
    if (!taskId || !domainName) return;

    try {
      const response = await fetch(`http://localhost:8000/domain-details/${taskId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "completed" && data.domain_details) {
          const domainDescription = data.domain_details.find(
            detail => detail.domainName === `${domainName}.lk` || 
                     detail.domainName === domainName
          );
          
          if (domainDescription) {
            console.log("Found background-generated description:", domainDescription);
            setDomainDetails(domainDescription);
            setLoading(false);
            return true;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching background descriptions:", error);
    }
    
    return false;
  };

  // Check for individual domain detail (for partial results)
  const checkIndividualDomainDetail = async (taskId, domainName) => {
    try {
      const response = await fetch(`http://localhost:8000/domain-detail/${taskId}/${domainName}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "available" && data.domain_detail) {
          console.log("Found individual domain detail:", data.domain_detail);
          setDomainDetails(data.domain_detail);
          setLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking individual domain detail:", error);
    }
    
    return false;
  };

  // Generate description synchronously as fallback
  const generateSyncDescription = async () => {
    const prompt = sessionStorage.getItem("userPrompt");
    const domainName = sessionStorage.getItem("selectedDomain");
    
    setLoadingMessage("Generating domain insights...");
    console.log("Generating description synchronously for:", domainName);
    
    const response = await fetch("http://localhost:8000/details/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        prompt: prompt || "domain name analysis", 
        domain_name: domainName 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    console.log("Generated description synchronously:", data);
    return data;
  };

  useEffect(() => {
    const fetchDomainDetails = async () => {
      try {
        const prompt = sessionStorage.getItem("userPrompt");
        const domainName = sessionStorage.getItem("selectedDomain");
        const taskId = sessionStorage.getItem("taskId");
        const cachedDescription = sessionStorage.getItem("domainDescription");

        if (!domainName) {
          throw new Error("No domain name found");
        }

        // Check if we have cached background-generated description
        if (cachedDescription) {
          try {
            const parsedDescription = JSON.parse(cachedDescription);
            console.log("Using cached description:", parsedDescription);
            setDomainDetails(parsedDescription);
            setLoading(false);
            return;
          } catch (e) {
            console.warn("Failed to parse cached description, will fetch from backend");
          }
        }

        // If we have a taskId, try multiple approaches
        if (taskId) {
          // First, try to connect to WebSocket for real-time updates
          setLoadingMessage("Connecting to real-time updates...");
          connectWebSocket(taskId, domainName);
          
          // Also check if description is already available
          setLoadingMessage("Checking for available description...");
          
          // Try individual domain detail endpoint first
          const foundIndividual = await checkIndividualDomainDetail(taskId, domainName);
          if (foundIndividual) return;
          
          // Then try the full background results
          const foundBackground = await fetchBackgroundDescriptions();
          if (foundBackground) return;
          
          // Check task status to see if we should wait
          const statusResponse = await fetch(`http://localhost:8000/task-status/${taskId}`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'processing') {
              setLoadingMessage("Description is being generated in real-time...");
              // WebSocket will handle the update
              return;
            } else if (statusData.status === 'completed') {
              // Task completed but we don't have this specific domain's description
              // Fall through to synchronous generation
              setLoadingMessage("Task completed, but description not found. Generating...");
            } else if (statusData.status === 'failed') {
              setLoadingMessage("Background generation failed. Creating description...");
            }
          }
        }

        // Fallback: Generate description synchronously
        const syncDescription = await generateSyncDescription();
        setDomainDetails(syncDescription);
        setLoading(false);
        
      } catch (err) {
        console.error("Error fetching domain details:", err);
        setError(err.message);
        
        // Create fallback domain details
        const domainName = sessionStorage.getItem("selectedDomain");
        const prompt = sessionStorage.getItem("userPrompt");
        
        setDomainDetails({
          domainName: `${domainName}.lk`,
          domainDescription: `${domainName} is a great domain name that could be suitable for your business needs. This domain offers potential for various applications and could serve as a strong foundation for your online presence.`,
          relatedFields: ["Business", "Technology", "Innovation", "Digital Services", "E-commerce"],
          fallback: true
        });
        setLoading(false);
      }
    };

    fetchDomainDetails();
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">{loadingMessage}</p>
        <div className="loading-details">
          <small>
            {isRealTimeUpdate 
              ? "Connected to real-time updates! Description will appear automatically."
              : "This may take a few moments..."
            }
          </small>
          {connectionStatus === 'connected' && (
            <div className="connection-indicator">
              <span className="connection-badge live">🟢 Live Connection</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && !domainDetails) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p className="error-message">{error}</p>
        <button 
          className="btn btn-primary retry-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="domain-details container py-5">
      <div className="row">
        <div className="col-12">
          <div className="domain-header">
            <h1 className="domain-title text-center mb-2">{domainDetails.domainName}</h1>
            
            {/* Real-time update indicator */}
            {isRealTimeUpdate && (
              <div className="real-time-notice">
                <small>✨ This description was generated using real-time updates</small>
              </div>
            )}
            
            {domainDetails.fallback && (
              <div className="fallback-notice">
                <small>⚠️ Using fallback description due to generation error</small>
              </div>
            )}
            
            {domainDetails.error && (
              <div className="generation-notice">
                <small>ℹ️ Generated with limited information: {domainDetails.error}</small>
              </div>
            )}
          </div>

          <hr className="section-divider my-4" />

          <div className="about-domain">
            <h2 className="section-heading mb-3">About {domainDetails.domainName}</h2>
            <div className="description-container">
              <p className="domain-description mb-3">
                {domainDetails.domainDescription}
              </p>
              
              {/* Show generation source */}
              <div className="generation-info">
                <small className="text-muted">
                  {isRealTimeUpdate ? 
                    "🚀 Generated using real-time processing" : 
                    sessionStorage.getItem("domainDescription") ? 
                      "✨ Generated using background processing" : 
                      "🔄 Generated on-demand"
                  }
                </small>
              </div>
            </div>
          </div>

          <div className="related-fields mb-5">
            <h2 className="section-heading mb-3">Related Fields</h2>
            <ul className="fields-list list-unstyled row">
              {domainDetails.relatedFields && domainDetails.relatedFields.map((field, index) => (
                <li key={index} className="col-md-4 col-sm-6 mb-2">
                  <span className="field-badge">- {field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="domain-actions">
            <div className="domain-cta mt-4 text-center">
              <button
                className="btn btn-primary domain-link-btn me-3"
                onClick={() => {
                  // Copy domain name to clipboard
                  const cleanDomainName = domainDetails.domainName.replace('.lk', '');
                  navigator.clipboard.writeText(cleanDomainName)
                    .then(() => {
                      // Show alert
                      alert(`Your domain name "${cleanDomainName}" is copied! Paste it in domains.lk search bar.`);
                      // Open domains.lk in a new tab
                      window.open("https://www.domains.lk/", "_blank", "noopener,noreferrer");
                    })
                    .catch((err) => {
                      console.error("Failed to copy domain name:", err);
                      // Fallback: just open the website
                      window.open("https://www.domains.lk/", "_blank", "noopener,noreferrer");
                    });
                }}
              >
                🌐 Visit domains.lk
              </button>
              
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  const cleanDomainName = domainDetails.domainName.replace('.lk', '');
                  navigator.clipboard.writeText(cleanDomainName)
                    .then(() => {
                      alert(`Domain name "${cleanDomainName}" copied to clipboard!`);
                    })
                    .catch((err) => {
                      console.error("Failed to copy domain name:", err);
                    });
                }}
              >
                📋 Copy Domain Name
              </button>
            </div>
            
            <div className="additional-actions mt-3 text-center">
              <button
                className="btn btn-link"
                onClick={() => window.history.back()}
              >
                ← Back to Results
              </button>
              
              {/* Show regenerate option if needed */}
              {(domainDetails.error || domainDetails.fallback) && (
                <button
                  className="btn btn-outline-warning ms-2"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    setLoadingMessage("Regenerating description...");
                    generateSyncDescription()
                      .then(data => {
                        setDomainDetails(data);
                        setLoading(false);
                      })
                      .catch(err => {
                        setError(err.message);
                        setLoading(false);
                      });
                  }}
                >
                  🔄 Regenerate Description
                </button>
              )}
            </div>
          </div>
          
          {/* Debug information for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info mt-4">
              <details>
                <summary>Debug Information</summary>
                <div className="debug-content">
                  <p><strong>Connection Status:</strong> {connectionStatus}</p>
                  <p><strong>Real-time Update:</strong> {isRealTimeUpdate ? 'Yes' : 'No'}</p>
                  <p><strong>Task ID:</strong> {sessionStorage.getItem("taskId")}</p>
                  <p><strong>Has Cached Description:</strong> {sessionStorage.getItem("domainDescription") ? 'Yes' : 'No'}</p>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainDetails;