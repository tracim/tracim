import React from 'react'
import logoFooter from '../img/logoFooter.svg'

const Footer = props => {
  return (
    <footer className='footer text-right'>
      <div className='footer__text'>
        Créer votre propre espace de travail collaboratif sur trac.im - Copyright 2013 - 2017
      </div>
      <img className='footer__logo' src={logoFooter} />
    </footer>
  )
}
export default Footer
