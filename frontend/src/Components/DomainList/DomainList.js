import React, { useEffect, useState } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css";
import { useNavigate } from "react-router-dom";

const DomainList = () => {
  const [domainNames, setDomainNames] = useState([]);
  const [visibleDomains, setVisibleDomains] = useState(6);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const handleLoadMore = () => {
    setVisibleDomains((prev) => prev + 6);
  };

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() === "") return;
    
    sessionStorage.setItem("userPrompt", searchInput);
    sessionStorage.removeItem("cachedDomains"); // Clear cache for new search
    setLoading(true);
    fetchDomains(searchInput);
  };

  const fetchDomains = async (prompt) => {
    try {
      const response = await fetch("http://localhost:8000/generate-domains/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setDomainNames(data.domains);
      // Cache the results
      sessionStorage.setItem("cachedDomains", JSON.stringify({
        prompt,
        domains: data.domains,
        timestamp: Date.now()
      }));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching domains:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const prompt = sessionStorage.getItem("userPrompt") || "default";
    setSearchInput(prompt);

    // Check for cached domains
    const cachedData = sessionStorage.getItem("cachedDomains");
    if (cachedData) {
      const { prompt: cachedPrompt, domains } = JSON.parse(cachedData);
      if (cachedPrompt === prompt) {
        setDomainNames(domains);
        setLoading(false);
        return;
      }
    }
    
    fetchDomains(prompt);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Fetching domain Names...</p>
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
      <div className="container">
      <div className="row justify-content-around">
        {domainNames.slice(0, visibleDomains).map((name, index) => (
          <div className="item col-lg-6 col-md-6 col-sm-12 mb-4" key={index}>
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
    </div>
  );
};

export default DomainList;