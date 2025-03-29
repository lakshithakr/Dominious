import React from 'react';

import NavBar from './Components/NavBar/NavBar';
import Footer from './Components/Footer/Footer';
import About from './Components/About/About';
import Description from './Components/Description/Description';
import DomainSearch from './Components/DomainSearch/DomainSearch';
import DomainCard from './Components/DomainCard/DomainCard';
import DomainList from './Components/DomainList/DomainList';
function App() {
  return (
    <>
    <NavBar/>
    <DomainSearch/>
    {/* <About/> */}
    {/* <Description/> */}
    <DomainList/>
    <Footer/>
    </>
  );
}

export default App;
