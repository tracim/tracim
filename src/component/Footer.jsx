import React from 'react'
import { translate } from 'react-i18next'
import logoFooter from '../img/logoFooter.svg'

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
