import React, { useState } from 'react';
import './DomainSearch.css';
import { useNavigate } from "react-router-dom";

const DomainSearch = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if the prompt is empty before submitting
    if (prompt.trim() === "") return;

    sessionStorage.setItem("userPrompt", prompt);
    navigate("/domains");
  };

  return (
    <div className="domain-search-container">
      <div className="overlay" />
      <div className="content">
        <h2 className="title">Make Your Mark Online with a Proud Sri Lankan Domain</h2>
        <p className="subtitle">Be Part of the .lk Family Today!</p>
        <form onSubmit={handleSubmit} className="search-box">
          <input
            type="text"
            placeholder="Describe your domain name"
            className="search-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>
    </div>
  );
}

export default DomainSearch;