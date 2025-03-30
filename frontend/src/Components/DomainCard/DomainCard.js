import React from "react";
import "./DomainCard.css"; // Optional for additional styling

const DomainCard = ({ domainName }) => {
  return (
    <a href='/details'><div className="card border-dark domain-card">
      <div className="card-body d-flex justify-content-between align-items-center">
        <h5 className="card-title">{domainName}</h5>
        <button className="btn btn-success btn-sm">Domain Available</button>
      </div>
    </div></a>
  );
};

export default DomainCard;