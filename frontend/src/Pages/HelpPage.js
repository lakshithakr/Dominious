import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import Help from '../Components/Help/Help'
import Footer from '../Components/Footer/Footer'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'
const HelpPage = () => {
  return (
    <div> 
        <MobileNavbar/>       
        <NavBar/>
        <Help/>
        <Footer/>
    </div>
  )
}

export default HelpPage