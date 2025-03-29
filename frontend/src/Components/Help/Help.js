import React from 'react'
import helpimg from '../../Images/help.jpg'
import './Help.css'
const Help = () => {
  return (
    <section className="help">
        <div className="help-content">
            <h2>Help</h2>
            <ul>
            <li>Add keywords related to your business or idea
            (e.g.,    "food delivery", "travel guide").</li>
            <li>Choose between Sinhala-English mixed names or fully English names.</li>
            <li>Click Generate to get .lk domain name ideas tailored to your input.</li>
            <li>Review the list and pick names you like. Adjust keywords to try different options.</li>
            </ul>
        </div>
        <div className="help-image">
            <img src={helpimg} alt="AI-powered domain system" />
        </div>
    </section>
  )
}

export default Help