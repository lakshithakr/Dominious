import React from 'react'
import NavBar from '../Components/NavBar/NavBar'
import Footer from '../Components/Footer/Footer'
import DomainSearch from '../Components/DomainSearch/DomainSearch'
import DomainDetails from '../Components/DomainDetails/DomainDetails'
import MobileNavbar from '../Components/MobileNavbar/MobileNavbar'

// const domain_details = {
//     domainName: "FinanceFly.lk",
//     domainDescription: [
//       "FinanceFly is a dynamic and innovative financial management platform designed to help individuals and businesses take control of their financial future.",
//       "The name combines 'Finance' with 'Fly,' symbolizing the ability to elevate financial operations to new heights with speed and precision. Whether it's streamlining daily budgeting, tracking expenses, or making informed investment decisions, FinanceFly aims to provide users with a seamless and intuitive experience.",
//       "With a focus on user-friendly design and cutting-edge technology, FinanceFly empowers users to make smarter financial choices, optimize their wealth, and achieve their goals faster."
//     ],
//     relatedFields: [
//       "Personal Finance Management",
//       "Budgeting Tools",
//       "Financial Planning & Advisory",
//       "Expense Tracking Solutions",
//       "Investment & Portfolio Management"
//     ]
//   };
const DomiandetailsPage = () => {
  return (
    <div>
        <MobileNavbar/>
        <NavBar/>
        {/* <DomainSearch /> */}
        <DomainDetails />
    </div>
  )
}

export default DomiandetailsPage