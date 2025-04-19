// src/components/DomainDetails.js

import React, { useEffect, useState } from 'react';
import './DomainDetails.css';

const DomainDetails = () => {
  const [domainDetails, setDomainDetails] = useState(null);

  useEffect(() => {
    const prompt = sessionStorage.getItem("userPrompt");
    const domainName = sessionStorage.getItem("selectedDomain");

    fetch("http://127.0.0.1:8000/details/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, domain_name: domainName })
    })
      .then((res) => res.json())
      .then((data) => {
        setDomainDetails(data);
      });
  }, []);

  if (!domainDetails) return <p>Loading...</p>;

  return (
    <div className="domain-details container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="domain-title text-center mb-4">{domainDetails.domainName}</h1>

          <hr className="section-divider my-4" />

          <div className="about-domain">
            <h2 className="section-heading mb-3">About {domainDetails.domainName}</h2>
            {domainDetails.domainDescription.map((paragraph, index) => (
              <p key={index} className="domain-description mb-3">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="related-fields mb-5">
            <h2 className="section-heading mb-3">Related Fields</h2>
            <ul className="fields-list list-unstyled row">
              {domainDetails.relatedFields.map((field, index) => (
                <li key={index} className="col-md-4 col-sm-6 mb-2">
                  <span className="field-badge">- {field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="domain-cta mt-4 text-center">
            <a 
              href='https://domains.lk' 
              className="btn btn-primary domain-link-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit domains.lk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainDetails;
