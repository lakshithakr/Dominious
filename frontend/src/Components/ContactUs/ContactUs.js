import React from 'react'
import './ContactUs.css'
import contactus from '../../Images/contact_us.jpg'

const ContactUs = () => {
  return (
    <div className="container mt-5 contact-container">
      <div className="row">
        <div className="col-12 text-center mb-4">
          <h2 className="section-title">Contact Us</h2>
          <div className="title-underline"></div>
        </div>
      </div>
      
      <div className="row align-items-center">
        {/* Contact Information Section */}
        <div className="col-md-6">
          <div className="contact-card">
            <div className="contact-item">
              <div className="icon-wrapper">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <div className="contact-text">hostmaster@domain.lk</div>
            </div>
            
            <div className="contact-item">
              <div className="icon-wrapper">
                <i className="bi bi-telephone-fill"></i>
              </div>
              <div className="contact-text">+94 (0)11 421-6061</div>
            </div>
            
            <div className="contact-item">
              <div className="icon-wrapper">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div className="contact-text">
                LK Domain Registry,<br />
                106, Bernard's Business Park,<br />
                Dutugemunu Street, Dehiwala.
              </div>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="col-md-6 text-center">
          <img src={contactus} alt="Contact" className="contact-image" />
        </div>
      </div>
    </div>
  )
}

export default ContactUs