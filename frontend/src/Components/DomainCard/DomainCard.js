import React, { useState, useEffect } from "react";
import "./DomainCard.css";
import { useNavigate } from "react-router-dom";

const DomainCard = ({ 
  domainName, 
  taskId, 
  backgroundDescription = null,
  descriptionStatus = "pending", // "pending", "processing", "completed", "failed"
  isRealTimeUpdate = false
}) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(descriptionStatus);

  // Trigger animation when status changes to completed
  useEffect(() => {
    if (previousStatus !== 'completed' && descriptionStatus === 'completed') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousStatus(descriptionStatus);
  }, [descriptionStatus, previousStatus]);

  const handleClick = () => {
    // Store domain information for the details page
    sessionStorage.setItem("selectedDomain", domainName);
    sessionStorage.setItem("taskId", taskId);
    
    // Store background description if available
    if (backgroundDescription) {
      sessionStorage.setItem("domainDescription", JSON.stringify(backgroundDescription));
    }
    
    navigate("/details");
  };

  const getStatusIndicator = () => {
    switch (descriptionStatus) {
      case "completed":
        return (
          <div className={`description-status completed ${isAnimating ? 'status-animate' : ''}`}>
            <span className="status-icon success-icon">✓</span>
            <span className="status-text">Ready</span>
            {isRealTimeUpdate && (
              <span className="real-time-badge">Live</span>
            )}
          </div>
        );
      case "processing":
        return (
          <div className="description-status processing">
            <span className="status-icon spinner"></span>
            <span className="status-text">
              {isRealTimeUpdate ? 'Generating...' : 'Loading...'}
            </span>
            {isRealTimeUpdate && (
              <span className="real-time-badge processing">Live</span>
            )}
          </div>
        );
      case "loading":
        return (
          <div className="description-status loading">
            <span className="status-icon spinner"></span>
            <span className="status-text">Loading...</span>
          </div>
        );
      case "failed":
        return (
          <div className="description-status failed">
            <span className="status-icon">⚠</span>
            <span className="status-text">Retry</span>
          </div>
        );
      default:
        return (
          <div className="description-status pending">
            <span className="status-icon">⏳</span>
            <span className="status-text">Queued</span>
          </div>
        );
    }
  };

  const getCardClassName = () => {
    let baseClasses = "card border-dark domain-card";
    
    // Add status-specific classes
    switch (descriptionStatus) {
      case "completed":
        baseClasses += " status-completed";
        break;
      case "processing":
        baseClasses += " status-processing";
        break;
      case "loading":
        baseClasses += " status-loading";
        break;
      case "failed":
        baseClasses += " status-failed";
        break;
      default:
        baseClasses += " status-pending";
    }
    
    // Add animation class
    if (isAnimating) {
      baseClasses += " card-animate";
    }
    
    // Add real-time indicator
    if (isRealTimeUpdate && descriptionStatus === 'processing') {
      baseClasses += " real-time-active";
    }
    
    return baseClasses;
  };

  return (
    <div className={getCardClassName()} onClick={handleClick}>
      <div className="card-body">
        <div className="card-header-section d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">{domainName}</h5>
          <button className="btn btn-success btn-sm availability-btn">
            Domain Available
          </button>
        </div>
        
        {/* Description Status Indicator */}
        <div className="card-footer-section">
          {getStatusIndicator()}
          
          {/* Show description preview when available */}
          {backgroundDescription && descriptionStatus === "completed" && (
            <div className={`description-preview ${isAnimating ? 'description-animate' : ''}`}>
              <p className="preview-text">
                {backgroundDescription.domainDescription.slice(0, 80)}
                {backgroundDescription.domainDescription.length > 80 ? "..." : ""}
              </p>
              
              {/* Show related fields as tags */}
              {backgroundDescription.relatedFields && backgroundDescription.relatedFields.length > 0 && (
                <div className="preview-tags">
                  {backgroundDescription.relatedFields.slice(0, 3).map((field, index) => (
                    <span key={index} className="preview-tag">
                      {field}
                    </span>
                  ))}
                  {backgroundDescription.relatedFields.length > 3 && (
                    <span className="preview-tag more-tags">
                      +{backgroundDescription.relatedFields.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Show error message if failed */}
          {descriptionStatus === "failed" && (
            <div className="error-preview">
              <p className="error-text">
                Description generation failed. Click to try again.
              </p>
            </div>
          )}
          
          {/* Show processing hint */}
          {descriptionStatus === "processing" && isRealTimeUpdate && (
            <div className="processing-preview">
              <p className="processing-text">
                Description is being generated in real-time...
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Real-time update indicator */}
      {isRealTimeUpdate && descriptionStatus === 'processing' && (
        <div className="real-time-indicator">
          <div className="pulse-dot"></div>
        </div>
      )}
    </div>
  );
};

export default DomainCard;