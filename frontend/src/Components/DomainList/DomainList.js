import React, { useState } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css"; // Styling file

const domainNames = [
    "FinanceFly.lk",
    "MoneyMind.lk",
    "WealthWise.lk",
    "CashClever.lk",
    "EconoSavvy.lk",
    "FiscalFriend.lk",
    "ProsperityPath",
    "InvestInsight",
    "BudgetBoss",
    "CashCraft",
  ];
  
  const DomainList = () => {
    const [visibleDomains, setVisibleDomains] = useState(4);
  
    const handleLoadMore = () => {
      setVisibleDomains((prev) => prev + 4);
    };
  
    return (
      <div className="container mt-5">
        <div className="row justify-content-around">
          {domainNames.slice(0, visibleDomains).map((name, index) => (
            <div className="item col-lg-6 col-md-6 col-sm-12" key={index}>
              <DomainCard domainName={name} />
            </div>
          ))}
        </div>
        {visibleDomains < domainNames.length && (
          <div className="load text-center">
            <button className="button" onClick={handleLoadMore}>
              Load More
            </button>
          </div>
        )}
      </div>
    );
  };
  
  export default DomainList;