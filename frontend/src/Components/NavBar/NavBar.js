import React from 'react'
import './NavBar.css'
const Navbar = () => {
  return (
    <nav className='navbar'>
        <div className='navbar-brand'>Dominious</div>
        <ul className='navbar-links'>
            <li><a href='#'>Home</a></li>
            <li><a href='#'>Help</a></li>
            <li><a href='#'>About Us</a></li>
            <li><a href='#'>Conatct Us</a></li>
        </ul>
    </nav>
  )
}

export default Navbar