
import './MobileNavbar.css'
import { GiHamburgerMenu } from "react-icons/gi";
import { FcHome,FcPortraitMode,FcFactory,FcGraduationCap,FcTodoList,FcPhone } from "react-icons/fc";
import { MdOutlineBiotech } from "react-icons/md";
import { useState } from 'react'
import { Link } from "react-router-dom";
function MobileNavbar(){
    const [open,setOpen]=useState(false);
    const handleClick= () => {
        setOpen(!open);
    }
    ;
  return (
    <div className='mobile-nav'>
        <div className='navbar-header'>
            <p><GiHamburgerMenu size={25} onClick={handleClick}/></p>
            <h2 className="navbar-title">Dominious</h2>
        </div>
        {open ? (
                    <div className='mobile'>
                    <ul>
                                <li className="nav-item-mobile">
                                    <Link to="/">Home</Link> 
                                </li>
                                <li className="nav-item-mobile">
                                    <Link to="/help">Help</Link>      
                                </li>
        
        
                                <li className="nav-item-mobile">
                                    <Link to="/about">About Us</Link>      
                                </li>
        
        
                                <li className="nav-item-mobile">
                                    <Link to="/contact">Contact</Link>      
                                </li>
                    </ul>
                </div>
        ):null}
    </div>
  )
}

export default MobileNavbar