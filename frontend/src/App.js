import React from 'react';

import NavBar from './Components/NavBar/NavBar';
import Footer from './Components/Footer/Footer';
import About from './Components/About/About';
import Description from './Components/Description/Description';
import DomainSearch from './Components/DomainSearch/DomainSearch';
import DomainCard from './Components/DomainCard/DomainCard';
import DomainList from './Components/DomainList/DomainList';
import AboutUs from './Components/AboutUs/AboutUs';
import Help from './Components/Help/Help';
function App() {
  return (
    <>
    <NavBar/>
    <Help/>
    {/* <AboutUs/> */}
    {/* <DomainSearch/> */}
    {/* <About/> */}
    {/* <Description/> */}
    {/* <DomainList/> */}
    <Footer/>
    </>
  );
}

export default App;
