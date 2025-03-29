import React from 'react'
import './DomainSearch.css'
const DomainSearch = () => {
  return (
    <div className="domain-search-container">
    <div className="overlay" />
    <div className="content">
      <h2 className="title">Make Your Mark Online with a Proud Sri Lankan Domain</h2>
      <p className="subtitle">Be Part of the .lk Family Today!</p>
      <div className="search-box">
        <input
          type="text"
          placeholder="Describe your domain here"
          className="search-input"
        />
        <button className="search-button">Search</button>
      </div>
    </div>
  </div>
  );
}

export default DomainSearch