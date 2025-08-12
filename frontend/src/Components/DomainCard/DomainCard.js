import React, { useState } from "react";
import "./DomainCard.css";

const DomainCard = ({ domainName, description, isLoading }) => {
  const [showDescription, setShowDescription] = useState(false);

  const shortNote = description?.shortNote || "Tap to view more details";

  return (
    <div 
      className={`domain-card ${showDescription ? "expanded" : ""}`}
      onClick={() => setShowDescription(!showDescription)}
    >
      <div className="domain-header">
        <h5 className="domain-title">{domainName}.lk</h5>
        <span className="badge-availability">Available</span>
      </div>

      {/* Short Note Preview */}
      <p className="domain-note">{shortNote}</p>
      
      {/* Expandable Section */}
      <div className={`domain-description ${showDescription ? "open" : ""}`}>
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="loading-text">Loading description...</span>
          </div>
        ) : description ? (
          <>
            <p className="description-text">{description.domainDescription}</p>
            {description.relatedFields?.length > 0 && (
              <div className="related-fields">
                <strong className="related-title">Related Fields:</strong>
                <div className="fields-list">
                  {description.relatedFields.map((field, i) => (
                    <span key={i} className="field-badge">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="description-text muted">Description not available</p>
        )}
      </div>
    </div>
  );
};

export default DomainCard;
