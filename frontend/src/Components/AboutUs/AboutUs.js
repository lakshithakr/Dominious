import React from 'react'
import './AboutUs.css'
import AboutUsImage from '../../Images/about_us.jpg'
const AboutUs = () => {
  return (
    <section className="aboutus">
        <div className="aboutus-content">
            <h2>Overview</h2>
            <p>
            The LK Domain Registry was established in 1990. Since its inception, it has served the country not only by providing a professional domain registration service, but also by facilitating development of Internet infrastructure to improve the Internet in Sri Lanka.
            </p>
            <p>
            The LK Domain Registry is the sole administrator for web addresses that end in “.lk” in Sri Lanka. As the national-level domain name, a “.lk” domain provides Sri Lankan organizations and individuals with their unique brand identity on the Internet. We register a wide range of domain names including the top-level domains .lk, .com.lk, .org.lk, .edu.lk, .hotel.lk and .web.lk.
            </p>
            <p>
            In addition to English, domain names can also be registered in the Sinhala and Tamil language top-level domains. Its clientele spans all countries, with a majority of it resident in Sri Lanka.
            </p>
        </div>
        <div className="aboutus-image">
            <img src={AboutUsImage} alt="AI-powered domain system" />
        </div>
      </section>
  )
}

export default AboutUs