import React, { useEffect, useState, useCallback } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css";
import { useNavigate } from "react-router-dom";

const DomainList = () => {
  const [domainNames, setDomainNames] = useState([]);
  const [visibleDomains, setVisibleDomains] = useState(6);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  
  // Background processing states
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [domainDescriptions, setDomainDescriptions] = useState({});
  const [backgroundError, setBackgroundError] = useState(null);
  
  const navigate = useNavigate();

  const handleLoadMore = () => {
    setVisibleDomains((prev) => prev + 6);
  };

  // Poll for task status and descriptions
  const pollTaskStatus = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/task-status/${id}`);
      if (response.ok) {
        const status = await response.json();
        setTaskStatus(status);

        // If task is completed, fetch descriptions
        if (status.status === 'completed') {
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
  }, []);

  // Fetch descriptions when ready
  const fetchDescriptions = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/domain-details/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed' && data.domain_details) {
          const descriptionsMap = {};
          data.domain_details.forEach(item => {
            // Extract domain name without .lk extension for matching
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

  // Start polling when we have a task ID
  useEffect(() => {
    if (!taskId || !taskStatus) return;

    if (taskStatus.status === 'pending' || taskStatus.status === 'processing') {
      const pollInterval = setInterval(async () => {
        const shouldContinue = await pollTaskStatus(taskId);
        if (!shouldContinue) {
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [taskId, taskStatus, pollTaskStatus]);

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() === "") return;

    sessionStorage.setItem("userPrompt", searchInput);
    
    // Clear all cached data for new search
    sessionStorage.removeItem("cachedDomains");
    sessionStorage.removeItem("domainDescriptions");
    
    // Reset all states
    setLoading(true);
    setDomainNames([]);
    setDomainDescriptions({});
    setTaskId(null);
    setTaskStatus(null);
    setBackgroundError(null);
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
      
      // Cache the domain names
      sessionStorage.setItem("cachedDomains", JSON.stringify({
        prompt,
        domains: data.domains || [],
        taskId: data.task_id,
        timestamp: Date.now()
      }));

      // Start polling for background task status if task_id is available
      if (data.task_id) {
        setTaskStatus({ status: 'pending', progress: 0 });
        await pollTaskStatus(data.task_id);
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
      // Task completed but this specific domain might not have description
      return domainDescriptions[domainName] ? 'completed' : 'failed';
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
                setTaskStatus({ status: 'completed', progress: 100 });
              }
            } else {
              // Try to fetch current task status
              pollTaskStatus(cachedTaskId);
            }
          }
          
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
        // Clear corrupted cache
        sessionStorage.removeItem("cachedDomains");
        sessionStorage.removeItem("domainDescriptions");
      }
    }

    // If no valid cache, fetch new domains
    fetchDomains(prompt);
  }, [pollTaskStatus]);

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

      {/* Background Task Progress Indicator */}
      {taskStatus && taskStatus.status !== 'completed' && (
        <div className="task-progress-container">
          <div className="task-progress">
            <div className="progress-header">
              <span className={`status-badge ${taskStatus.status}`}>
                {taskStatus.status === 'pending' ? '⏳ Queued' : 
                 taskStatus.status === 'processing' ? '🔄 Generating Descriptions' : 
                 taskStatus.status === 'completed' ? '✅ Complete' : 
                 '❌ Failed'}
              </span>
              <span className="progress-text">
                {taskStatus.processed_domains || 0} of {taskStatus.total_domains || domainNames.length} descriptions ready
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${taskStatus.progress || 0}%`,
                  backgroundColor: taskStatus.status === 'failed' ? '#dc3545' : '#007bff'
                }}
              />
            </div>
            <div className="progress-info">
              <small>Domain descriptions are being generated in the background. You can click on domains now - descriptions will appear automatically when ready!</small>
            </div>
          </div>
        </div>
      )}

      {/* Success message when descriptions are complete */}
      {taskStatus && taskStatus.status === 'completed' && (
        <div className="completion-notification">
          <div className="completion-message">
            ✨ All domain descriptions are ready! Click on any domain to see detailed insights.
          </div>
        </div>
      )}

      {/* Error notification */}
      {backgroundError && (
        <div className="error-notification">
          <div className="error-message">
            ⚠️ {backgroundError}. You can still view domains and generate descriptions individually.
          </div>
        </div>
      )}

      <div className="container mt-5">
        <div className="results-header">
          <h2>Found {domainNames.length} Domain Suggestions</h2>
          <p className="results-subtitle">
            Click on any domain to see detailed information and availability
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