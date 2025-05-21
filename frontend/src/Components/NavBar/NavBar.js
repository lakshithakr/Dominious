import React from 'react'
import './NavBar.css'
const Navbar = () => {
  return (
    <nav className='navbar'>
        <div className='navbar-brand'><a href='/'>Dominious</a></div>
        <ul className='navbar-links'>
            <li><a href='/'>Home</a></li>
            <li><a href='/help'>Help</a></li>
            <li><a href='/about'>About Us</a></li>
            <li><a href='/contact'>Conatct Us</a></li>
        </ul>
    </nav>
  )
}

export default Navbar