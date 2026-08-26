import React from 'react'

require('./FooterLogin.styl')

export const FooterLogin = () =>
  <footer className='loginpage__main__footer'>
    <div className='loginpage__main__footer__text'>
      <a
        className='loginpage__main__footer__text__link'
        href='https://www.tracim-teamwork.com'
        target='_blank'
        rel='noopener noreferrer'
      >
        Tracim
      </a> ▫️ © 2013-2026
    </div>
  </footer>

export default FooterLogin
