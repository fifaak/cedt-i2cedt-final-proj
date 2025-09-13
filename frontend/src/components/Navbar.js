import React from 'react';
import '../styles/responsive.css';

const Navbar = () => {
  const toggleMenu = () => {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Your Brand</div>
      
      <div className="hamburger" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <ul className="nav-menu">
        {/* ...existing navigation items... */}
      </ul>
    </nav>
  );
};

export default Navbar;