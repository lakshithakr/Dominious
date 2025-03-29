import React from 'react'
import How_it_work_Image from '../../Images/how_it.jpg'
import './Description.css'
const Description = () => {
  return (
    <section className="description">
        <div className="description-content">
            <h2>How It Works?</h2>
            <p>
                <a href="#">Dominios</a> analyzes the keywords, themes, and context you provide using AI models trained on a diverse dataset of web, business, and linguistic patterns. It understands your requirements and combines creativity with data-driven insights to suggest domain names. The system incorporates both English and Sinhala language blending, evaluates the relevance and appeal of generated names, and checks for domain availability. The result is a curated list of smart, meaningful domain names ready for you to choose from.
            </p>
        </div>
        <div className="description-image">
            <img src={How_it_work_Image} alt="How It Works" />
        </div>
      </section>
  )
}

export default Description