import React from "react";
import "./DomainCard.css";
import { useNavigate } from "react-router-dom";

const DomainCard = ({ 
  domainName, 
  taskId, 
  backgroundDescription = null,
  descriptionStatus = "pending" // "pending", "processing", "completed", "failed"
}) => {
  const navigate = useNavigate();

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
          <div className="description-status completed">
            <span className="status-icon">✓</span>
            <span className="status-text">Ready</span>
          </div>
        );
      case "processing":
        return (
          <div className="description-status processing">
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
            <span className="status-text">Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="card border-dark domain-card" onClick={handleClick}>
      <div className="card-body">
        <div className="card-header-section d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">{domainName}</h5>
          <button className="btn btn-success btn-sm">Domain Available</button>
        </div>
        
        {/* Description Status Indicator */}
        <div className="card-footer-section">
          {getStatusIndicator()}
          {backgroundDescription && descriptionStatus === "completed" && (
            <p className="description-preview">
              {backgroundDescription.domainDescription.slice(0, 80)}
              {backgroundDescription.domainDescription.length > 80 ? "..." : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainCard;