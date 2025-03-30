import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import About from '../Components/About/About'
import Description from '../Components/Description/Description'
import Footer from '../Components/Footer/Footer'
import DomainSearch from '../Components/DomainSearch/DomainSearch'

const HomePage = () => {
  return (
    <div>
        <NavBar/>
        <DomainSearch/>
        <About/>
        <Description/>
        <Footer/>
    </div>
  )
}

export default HomePage