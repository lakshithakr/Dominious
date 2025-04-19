import React from "react";
import "./DomainCard.css";
import { useNavigate } from "react-router-dom";

const DomainCard = ({ domainName }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    sessionStorage.setItem("selectedDomain", domainName);
    navigate("/details");
  };

  return (
    <div className="card border-dark domain-card" onClick={handleClick}>
      <div className="card-body d-flex justify-content-between align-items-center">
        <h5 className="card-title">{domainName}</h5>
        <button className="btn btn-success btn-sm">Domain Available</button>
      </div>
    </div>
  );
};

export default DomainCard;