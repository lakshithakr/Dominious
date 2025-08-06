import React, { useEffect, useState, useCallback, useRef } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css";
import { useNavigate } from "react-router-dom";

const DomainList = () => {
  const [domainNames, setDomainNames] = useState([]);
  const [visibleDomains, setVisibleDomains] = useState(6);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  
  // WebSocket and background processing states
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [domainDescriptions, setDomainDescriptions] = useState({});
  const [backgroundError, setBackgroundError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [progress, setProgress] = useState({ processed: 0, total: 0, percentage: 0 });
  
  const wsRef = useRef(null);
  const navigate = useNavigate();

  const handleLoadMore = () => {
    setVisibleDomains((prev) => prev + 6);
  };

  // WebSocket connection management
  const connectWebSocket = useCallback((taskId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/${taskId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for task:', taskId);
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);

        switch (message.type) {
          case 'domain_update':
            // Update specific domain detail as it comes in
            const domainData = message.data;
            const domainKey = domainData.domainName.replace('.lk', '');
            
            setDomainDescriptions(prev => ({
              ...prev,
              [domainKey]: domainData
            }));
            
            // Update cache with new description
            const cachedDescriptions = JSON.parse(sessionStorage.getItem("domainDescriptions") || "{}");
            cachedDescriptions[domainKey] = domainData;
            sessionStorage.setItem("domainDescriptions", JSON.stringify({
              taskId: taskId,
              descriptions: cachedDescriptions,
              timestamp: Date.now()
            }));
            break;

          case 'progress_update':
            // Update progress information
            const progressData = message.data;
            setProgress({
              processed: progressData.processed,
              total: progressData.total,
              percentage: progressData.progress
            });
            
            setTaskStatus(prev => ({
              ...prev,
              status: 'processing',
              progress: progressData.progress,
              processed_domains: progressData.processed,
              total_domains: progressData.total
            }));
            break;

          case 'completed':
            // All domains completed
            console.log('All domain descriptions completed');
            setTaskStatus(prev => ({
              ...prev,
              status: 'completed',
              progress: 100
            }));
            setConnectionStatus('completed');
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
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      setBackgroundError('WebSocket connection error');
    };
  }, []);

  // Clean up WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch task status (fallback when WebSocket isn't available)
  const pollTaskStatus = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/task-status/${id}`);
      if (response.ok) {
        const status = await response.json();
        setTaskStatus(status);
        setProgress({
          processed: status.processed_domains || 0,
          total: status.total_domains || 0,
          percentage: status.progress || 0
        });

        // If task is completed and we don't have WebSocket, fetch descriptions
        if (status.status === 'completed' && connectionStatus !== 'connected') {
          await fetchDescriptions(id);
          return false; // Stop polling
        } else if (status.status === 'failed') {
          setBackgroundError('Description generation failed');
          return false; // Stop polling
        }
        return true; // Continue polling
      }
    } catch (err) {
      console.error('Error polling task status:', err);
      setBackgroundError('Error checking description status');
      return false; // Stop polling on error
    }
  }, [connectionStatus]);

  // Fetch descriptions when ready (fallback method)
  const fetchDescriptions = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/domain-details/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed' && data.domain_details) {
          const descriptionsMap = {};
          data.domain_details.forEach(item => {
            const domainKey = item.domainName.replace('.lk', '');
            descriptionsMap[domainKey] = item;
          });
          setDomainDescriptions(descriptionsMap);
          
          // Cache descriptions for future use
          sessionStorage.setItem("domainDescriptions", JSON.stringify({
            taskId: id,
            descriptions: descriptionsMap,
            timestamp: Date.now()
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching descriptions:', err);
      setBackgroundError('Error fetching descriptions');
    }
  };

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() === "") return;

    sessionStorage.setItem("userPrompt", searchInput);
    
    // Clear all cached data for new search
    sessionStorage.removeItem("cachedDomains");
    sessionStorage.removeItem("domainDescriptions");
    
    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Reset all states
    setLoading(true);
    setDomainNames([]);
    setDomainDescriptions({});
    setTaskId(null);
    setTaskStatus(null);
    setBackgroundError(null);
    setConnectionStatus('disconnected');
    setProgress({ processed: 0, total: 0, percentage: 0 });
    setVisibleDomains(6);
    
    fetchDomains(searchInput);
  };

  const fetchDomains = async (prompt) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/generate-domains/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setDomainNames(data.domains || []);
      setTaskId(data.task_id);
      setProgress({ processed: 0, total: data.total_domains || 0, percentage: 0 });
      
      // Cache the domain names
      sessionStorage.setItem("cachedDomains", JSON.stringify({
        prompt,
        domains: data.domains || [],
        taskId: data.task_id,
        timestamp: Date.now()
      }));

      // Connect to WebSocket for real-time updates
      if (data.task_id) {
        setTaskStatus({ 
          status: 'pending', 
          progress: 0, 
          total_domains: data.total_domains || 0,
          processed_domains: 0 
        });
        
        // Try WebSocket first, fallback to polling
        try {
          connectWebSocket(data.task_id);
          
          // Start polling as backup if WebSocket doesn't connect within 3 seconds
          setTimeout(() => {
            if (connectionStatus !== 'connected') {
              console.log('WebSocket not connected, falling back to polling');
              const pollInterval = setInterval(async () => {
                const shouldContinue = await pollTaskStatus(data.task_id);
                if (!shouldContinue) {
                  clearInterval(pollInterval);
                }
              }, 2000);
            }
          }, 3000);
        } catch (error) {
          console.error('WebSocket connection failed, using polling:', error);
          // Fallback to polling immediately
          const pollInterval = setInterval(async () => {
            const shouldContinue = await pollTaskStatus(data.task_id);
            if (!shouldContinue) {
              clearInterval(pollInterval);
            }
          }, 2000);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching domains:", error);
      setBackgroundError(`Failed to generate domains: ${error.message}`);
      setLoading(false);
    }
  };

  // Helper function to get description status for a domain
  const getDescriptionStatus = (domainName) => {
    if (domainDescriptions[domainName]) {
      return 'completed';
    } else if (taskStatus?.status === 'processing') {
      return 'processing';
    } else if (taskStatus?.status === 'failed' || backgroundError) {
      return 'failed';
    } else if (taskStatus?.status === 'completed') {
      return domainDescriptions[domainName] ? 'completed' : 'loading';
    } else {
      return 'pending';
    }
  };

  useEffect(() => {
    const prompt = sessionStorage.getItem("userPrompt") || "default";
    setSearchInput(prompt);

    // Check for cached domains first
    const cachedData = sessionStorage.getItem("cachedDomains");
    const cachedDescriptions = sessionStorage.getItem("domainDescriptions");
    
    if (cachedData) {
      try {
        const { prompt: cachedPrompt, domains, taskId: cachedTaskId } = JSON.parse(cachedData);
        
        if (cachedPrompt === prompt && domains && domains.length > 0) {
          setDomainNames(domains);
          
          if (cachedTaskId) {
            setTaskId(cachedTaskId);
            
            // Check if we have cached descriptions
            if (cachedDescriptions) {
              const { taskId: descTaskId, descriptions } = JSON.parse(cachedDescriptions);
              if (descTaskId === cachedTaskId) {
                setDomainDescriptions(descriptions);
                setTaskStatus({ 
                  status: 'completed', 
                  progress: 100,
                  total_domains: domains.length,
                  processed_domains: Object.keys(descriptions).length
                });
                setProgress({
                  processed: Object.keys(descriptions).length,
                  total: domains.length,
                  percentage: 100
                });
              }
            } else {
              // Try to reconnect WebSocket or poll for current status
              setTaskStatus({ status: 'pending', progress: 0 });
              pollTaskStatus(cachedTaskId);
            }
          }
          
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
        sessionStorage.removeItem("cachedDomains");
        sessionStorage.removeItem("domainDescriptions");
      }
    }

    // If no valid cache, fetch new domains
    fetchDomains(prompt);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Generating domain names...</p>
        <div className="loading-details">
          <small>This may take a few moments while we create unique suggestions for you.</small>
        </div>
      </div>
    );
  }

  if (domainNames.length === 0 && !loading) {
    return (
      <div className="new-container">
        <div className="new-search">
          <form onSubmit={handleNewSearch} className="search-box">
            <input
              type="text"
              placeholder="Search for new domain names..."
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </form>
        </div>
        
        <div className="no-results-container">
          <div className="no-results-icon">🔍</div>
          <h3>No domains found</h3>
          <p>Try a different search term or check your connection.</p>
          {backgroundError && (
            <div className="error-message">
              <small>Error: {backgroundError}</small>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="new-container">
      <div className="new-search">
        <form onSubmit={handleNewSearch} className="search-box">
          <input
            type="text"
            placeholder="Search for new domain names..."
            className="search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {/* Real-time Progress Indicator */}
      {taskStatus && (taskStatus.status === 'pending' || taskStatus.status === 'processing') && (
        <div className="task-progress-container">
          <div className="task-progress">
            <div className="progress-header">
              <div className="status-section">
                <span className={`status-badge ${taskStatus.status}`}>
                  {taskStatus.status === 'pending' ? '⏳ Queued' : '🔄 Generating Descriptions'}
                </span>
                <div className="connection-indicator">
                  <span className={`connection-status ${connectionStatus}`}>
                    {connectionStatus === 'connected' ? '🟢 Live' : 
                     connectionStatus === 'error' ? '🔴 Polling' : 
                     '🟡 Connecting'}
                  </span>
                </div>
              </div>
              <span className="progress-text">
                {progress.processed} of {progress.total} descriptions ready
              </span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progress.percentage}%`,
                  backgroundColor: taskStatus.status === 'failed' ? '#dc3545' : '#007bff',
                  transition: 'width 0.5s ease-in-out'
                }}
              />
            </div>
            
            <div className="progress-info">
              <small>
                {connectionStatus === 'connected' 
                  ? '🚀 Real-time updates enabled! Domain cards will update automatically as descriptions are ready.'
                  : '📡 Checking for updates every few seconds. Domain descriptions will appear as they become available.'
                }
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Success message when descriptions are complete */}
      {(taskStatus?.status === 'completed' || connectionStatus === 'completed') && (
        <div className="completion-notification">
          <div className="completion-message">
            ✨ All domain descriptions are ready! Click on any domain to see detailed insights.
          </div>
        </div>
      )}

      <div className="container mt-5">
        <div className="results-header">
          <h2>Found {domainNames.length} Domain Suggestions</h2>
          <p className="results-subtitle">
            Click on any domain to see detailed information and availability
            {progress.processed > 0 && ` • ${progress.processed} descriptions ready`}
          </p>
        </div>

        <div className="row justify-content-around">
          {domainNames.slice(0, visibleDomains).map((name, index) => (
            <div className="item col-lg-6 col-md-6 col-sm-12" key={index}>
              <DomainCard 
                domainName={name}
                taskId={taskId}
                backgroundDescription={domainDescriptions[name]}
                descriptionStatus={getDescriptionStatus(name)}
                isRealTimeUpdate={connectionStatus === 'connected'}
              />
            </div>
          ))}
        </div>

        {visibleDomains < domainNames.length && (
          <div className="load text-center">
            <button className="button" onClick={handleLoadMore}>
              Load More ({domainNames.length - visibleDomains} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainList;