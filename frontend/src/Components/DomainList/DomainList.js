import React, { useEffect,useState } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css"; // Styling file

// const domainNames = [
//     "FinanceFly.lk",
//     "MoneyMind.lk",
//     "WealthWise.lk",
//     "CashClever.lk",
//     "EconoSavvy.lk",
//     "FiscalFriend.lk",
//     "ProsperityPath",
//     "InvestInsight",
//     "BudgetBoss",
//     "CashCraft",
//   ];
  
  const DomainList = () => {
    const [domainNames, setDomainNames] = useState([]);
    const [visibleDomains, setVisibleDomains] = useState(4);
  
    const handleLoadMore = () => {
      setVisibleDomains((prev) => prev + 4);
    };
  
    useEffect(() => {
      const fetchDomains = async () => {
        try {
          const prompt = sessionStorage.getItem("userPrompt") || "default";
          const response = await fetch("http://localhost:8000/generate-domains/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
          });
  
          const data = await response.json();
          setDomainNames(data.domains);
        } catch (error) {
          console.error("Error fetching domains:", error);
        }
      };
  
      fetchDomains();
    }, []);
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