import React from 'react'
import { translate } from 'react-i18next'
import logoFooter from '../img/logoFooter.svg'

// @fixme: Côme - 2018/07/16 - component deprecated since footer is now inside sidebarleft
const Footer = ({ t }) => {
  return (
    <footer className='footer text-right'>
      <div className='footer__text'>
        {t('Footer.marketing_msg')} - {t('Footer.copyright')}
      </div>
      <img className='footer__logo' src={logoFooter} />
    </footer>
  )
}

export default translate()(Footer)
