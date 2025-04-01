import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import DomainList from '../Components/DomainList/DomainList'
import Footer from '../Components/Footer/Footer'
import DomainSearch from '../Components/DomainSearch/DomainSearch'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'
const DomainsPage = () => {
  return (
    <div>
        <MobileNavbar/>
        <NavBar/>
        <DomainSearch/>
        <DomainList/>
        <Footer/>
    </div>
  )
}

export default DomainsPage