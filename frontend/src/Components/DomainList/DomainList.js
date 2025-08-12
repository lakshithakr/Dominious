import React, { useEffect, useState, useCallback } from "react";
import DomainCard from "../DomainCard/DomainCard";
import "./DomainList.css";
import { useNavigate } from "react-router-dom";

const DomainList = () => {
  const [domainNames, setDomainNames] = useState([]);
  const [domainDescriptions, setDomainDescriptions] = useState({});
  const [visibleDomains, setVisibleDomains] = useState(6);
  const [loading, setLoading] = useState(true);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(1);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const navigate = useNavigate();

  const preloadDescriptions = useCallback(async (domains, prompt) => {
    if (!prompt || domains.length === 0) return;
    
    setDescriptionLoading(true);
    try {
      const response = await fetch("http://localhost:8001/details/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          domain_name: domains
        }),
      });

      const data = await response.json();
      if (data.descriptions) {
        const newDescriptions = {};
        data.descriptions.forEach(desc => {
          if (desc && desc.domainName) {
            const name = desc.domainName.replace('.lk', '');
            newDescriptions[name] = desc;
          }
        });
        setDomainDescriptions(prev => ({ ...prev, ...newDescriptions }));
      }
    } catch (error) {
      console.error("Error preloading descriptions:", error);
    } finally {
      setDescriptionLoading(false);
    }
  }, []);

  const fetchDomains = async (prompt) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8001/generate-domains/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setDomainNames(data.domains);
      sessionStorage.setItem("cachedDomains", JSON.stringify({
        prompt,
        domains: data.domains,
        timestamp: Date.now()
      }));
      
      // Preload descriptions for initial visible domains
      preloadDescriptions(data.domains.slice(0, visibleDomains), prompt);
    } catch (error) {
      console.error("Error fetching domains:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const prompt = sessionStorage.getItem("userPrompt") || "default";
    setSearchInput(prompt);

    const cachedData = sessionStorage.getItem("cachedDomains");
    if (cachedData) {
      const { prompt: cachedPrompt, domains } = JSON.parse(cachedData);
      if (cachedPrompt === prompt) {
        setDomainNames(domains);
        setLoading(false);
        preloadDescriptions(domains.slice(0, visibleDomains), prompt);
        return;
      }
    }

    fetchDomains(prompt);
  }, []);

  const handleLoadMore = () => {
    const newVisibleCount = visibleDomains + 6;
    setVisibleDomains(newVisibleCount);
    
    // Preload descriptions for newly visible domains
    const newDomains = domainNames.slice(visibleDomains, newVisibleCount);
    const prompt = sessionStorage.getItem("userPrompt") || "default";
    preloadDescriptions(newDomains, prompt);
  };

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() === "") return;

    sessionStorage.setItem("userPrompt", searchInput);
    sessionStorage.removeItem("cachedDomains");
    setDomainDescriptions({});
    setLoading(true);
    fetchDomains(searchInput);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const feedbackData = {
      rating: feedbackRating,
      name: feedbackName || null,
      email: feedbackEmail.trim() === "" ? null : feedbackEmail,
      comment: feedbackComment,
    };

    try {
      const res = await fetch("http://localhost:8001/submit-feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      const result = await res.json();
      if (res.ok) {
        setFeedbackStatus("Feedback submitted successfully!");
        setFeedbackRating(1);
        setFeedbackName("");
        setFeedbackEmail("");
        setFeedbackComment("");
      } else {
        setFeedbackStatus(result.message || "Submission failed");
      }
    } catch (err) {
      console.error("Feedback error:", err);
      setFeedbackStatus("Error submitting feedback.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Fetching domain names...</p>
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

      <div className="container mt-5">
        <div className="row justify-content-around">
          {domainNames.slice(0, visibleDomains).map((name, index) => (
            <div className="item col-lg-6 col-md-6 col-sm-12" key={index}>
              <DomainCard 
                domainName={name} 
                description={domainDescriptions[name]}
                isLoading={!domainDescriptions[name] && descriptionLoading}
              />
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

      <div className="feedback-section mt-5 p-4 border rounded bg-light">
        <h4 className="text-center mb-3">Share Your Feedback</h4>
        <form onSubmit={handleFeedbackSubmit} className="feedback-form">
          <h6 className="rating-header">How would you rate your experience?</h6>
          <div className="mb-3 star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  cursor: "pointer",
                  color: feedbackRating >= star ? "#ffc107" : "#e4e5e9",
                  fontSize: "1.5rem"
                }}
                onClick={() => setFeedbackRating(star)}
              >
                ★
              </span>
            ))}
          </div>

          <div className="mb-2">
            <input
              type="text"
              placeholder="Your Name (optional)"
              className="form-control"
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <input
              type="email"
              placeholder="Your Email (optional)"
              className="form-control"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <textarea
              placeholder="Your comments..."
              className="form-control"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Submit Feedback
          </button>

          {feedbackStatus && (
            <div className="alert alert-info mt-3 text-center">
              {feedbackStatus}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DomainList;