import React from 'react'

require('./FooterLogin.styl')

export const FooterLogin = () =>
  <footer className='loginpage__main__footer'>
    <div className='loginpage__main__footer__text'>
      copyright © 2013 - 2022&nbsp;-&nbsp;
      <a
        className='loginpage__main__footer__text__link'
        href='http://www.tracim.fr/'
        target='_blank'
        rel='noopener noreferrer'
      >
        tracim.fr
      </a>
    </div>
  </footer>

export default FooterLogin
