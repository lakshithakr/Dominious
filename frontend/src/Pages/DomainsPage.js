import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import DomainList from '../Components/DomainList/DomainList'
import Footer from '../Components/Footer/Footer'
import DomainSearch from '../Components/DomainSearch/DomainSearch'
const DomainsPage = () => {
  return (
    <div>
        <NavBar/>
        <DomainSearch/>
        <DomainList/>
        <Footer/>
    </div>
  )
}

export default DomainsPage