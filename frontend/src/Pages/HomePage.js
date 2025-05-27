import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import About from '../Components/About/About'
import Description from '../Components/Description/Description'
import Footer from '../Components/Footer/Footer'
import DomainSearch from '../Components/DomainSearch/DomainSearch'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'
const HomePage = () => {
  return (
    <div>
        <MobileNavbar/>
        <NavBar/>
        <DomainSearch/>
        <About/>
        <Description/>
    </div>
  )
}

export default HomePage