import React, { useEffect, useState } from 'react';
import './DomainDetails.css';

const DomainDetails = () => {
  const [domainDetails, setDomainDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Fetching domain insights...");

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
            console.log("Using background-generated description:", parsedDescription);
            setDomainDetails(parsedDescription);
            setLoading(false);
            return;
          } catch (e) {
            console.warn("Failed to parse cached description, will fetch from backend");
          }
        }

        // If we have a taskId, try to get background-generated descriptions
        if (taskId) {
          setLoadingMessage("Checking for background-generated description...");
          
          const backgroundResponse = await fetch(`http://127.0.0.1:8000/domain-details/${taskId}`);
          
          if (backgroundResponse.ok) {
            const backgroundData = await backgroundResponse.json();
            
            if (backgroundData.status === "completed" && backgroundData.domain_details) {
              // Find the description for this specific domain
              const domainDescription = backgroundData.domain_details.find(
                detail => detail.domainName === `${domainName}.lk` || 
                         detail.domainName === domainName
              );
              
              if (domainDescription) {
                console.log("Found background-generated description:", domainDescription);
                setDomainDetails(domainDescription);
                setLoading(false);
                return;
              }
            } else if (backgroundData.status === "processing") {
              setLoadingMessage("Background description is still being generated...");
              // Fall through to generate description synchronously
            }
          }
        }

        // Fallback: Generate description synchronously
        setLoadingMessage("Generating domain insights...");
        console.log("Generating description synchronously for:", domainName);
        
        const response = await fetch("http://127.0.0.1:8000/details/", {
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
        setDomainDetails(data);
        
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
      } finally {
        setLoading(false);
      }
    };

    fetchDomainDetails();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">{loadingMessage}</p>
        <div className="loading-details">
          <small>This may take a few moments...</small>
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
                  {sessionStorage.getItem("domainDescription") ? 
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainDetails;