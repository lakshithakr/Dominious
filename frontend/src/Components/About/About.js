import React from 'react'
import './About.css'
import AboutImage from '../../Images/about.jpg'
const About = () => {
  return (
    <section className="about">
        <div className="about-content">
            <h2>What Is Dominios?</h2>
            <p>
                <a href="#">Dominios</a> is an AI-powered domain name recommendation system designed to help you find creative, relevant, and impactful domain names. Whether you're launching a business, project, or personal brand, Dominios leverages advanced natural language processing and machine learning techniques to suggest domain names tailored to your input, combining both English and Sinhala terms when needed. It focuses on generating unique, brandable, and available domain names that resonate with your desired audience.
            </p>
        </div>
        <div className="about-image">
            <img src={AboutImage} alt="AI-powered domain system" />
        </div>
  </section>
  )
}

export default About