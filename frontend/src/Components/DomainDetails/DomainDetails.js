import React from 'react';
import './DomainDetails.css';

const DomainDetails = () => {
  const domain_details = {
    domainName: "FinanceFly.lk",
    domainDescription: [
      "FinanceFly is a dynamic and innovative financial management platform designed to help individuals and businesses take control of their financial future.",
      "The name combines 'Finance' with 'Fly,' symbolizing the ability to elevate financial operations to new heights with speed and precision. Whether it's streamlining daily budgeting, tracking expenses, or making informed investment decisions, FinanceFly aims to provide users with a seamless and intuitive experience.",
      "With a focus on user-friendly design and cutting-edge technology, FinanceFly empowers users to make smarter financial choices, optimize their wealth, and achieve their goals faster."
    ],
    relatedFields: [
      "Personal Finance Management",
      "Budgeting Tools",
      "Financial Planning & Advisory",
      "Expense Tracking Solutions",
      "Investment & Portfolio Management"
    ]
  };
  return (
    <div className="domain-details container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="domain-title text-center mb-4">{domain_details.domainName}</h1>
          
          {/* Related Fields Section */}

          <hr className="section-divider my-4" />

          {/* About Section */}
          <div className="about-domain">
            <h2 className="section-heading mb-3">About {domain_details.domainName}</h2>
            {domain_details.domainDescription.map((paragraph, index) => (
              <p key={index} className="domain-description mb-3">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="related-fields mb-5">
            <h2 className="section-heading mb-3">Related Fields</h2>
            <ul className="fields-list list-unstyled row">
              {domain_details.relatedFields.map((field, index) => (
                <li key={index} className="col-md-4 col-sm-6 mb-2">
                  <span className="field-badge">- {field}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Domain Link */}
          <div className="domain-cta mt-4 text-center">
            <a 
              href='#' 
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