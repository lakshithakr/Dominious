import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import AboutUs from '../Components/AboutUs/AboutUs'
import Footer from '../Components/Footer/Footer'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'
const AboutusPage = () => {
  return (
    <div>
        <MobileNavbar/>
        <NavBar/>
        <AboutUs/>
        <Footer/>
    </div>
  )
}

export default AboutusPage