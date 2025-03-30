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
import ContactUs from './Components/ContactUs/ContactUs';
import DomainDetails from './Components/DomainDetails/DomainDetails';

const domain_details = {
  domainName: "FinanceFly.lk",
  domainDescription: [
    "FinanceFly is a dynamic and innovative financial management platform designed to help individuals and businesses take control of their financial future.",
    "The name combines 'Finance' with 'Fly,' symbolizing the ability to elevate financial operations to new heights with speed and precision. Whether it's streamlining daily budgeting, tracking expenses, or making informed investment decisions, FinanceFly aims to provide users with a seamless and intuitive experience.",
    "With a focus on user-friendly design and cutting-edge technology, FinanceFly empowers users to make smarter financial choices, optimize their wealth, and achieve their goals faster."
  ],
  relatedFields: [
    "Personal Finance Management",
    "Budgeting Tools",
    "Financial Planning & Advisory",
    "Expense Tracking Solutions",
    "Investment & Portfolio Management"
  ]
};
function App() {
  return (
    <>
    {/* <NavBar/> */}
    {/* <DomainDetails data={domain_details}/> */}
    {/* <Help/> */}
    {/* <ContactUs/> */}
    {/* <AboutUs/> */}
    {/* <DomainSearch/> */}
    {/* <About/> */}
    {/* <Description/> */}
    {/* <DomainList/> */}
    {/* <Footer/> */}
    </>
  );
}

export default App;
