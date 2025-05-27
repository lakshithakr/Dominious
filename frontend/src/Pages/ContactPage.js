import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import ContactUs from '../Components/ContactUs/ContactUs'
import Footer from '../Components/Footer/Footer'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'
const ContactPage = () => {
  return (
    <div>
        <MobileNavbar/>
        <NavBar/>
        <ContactUs/>
    </div>
  )
}

export default ContactPage