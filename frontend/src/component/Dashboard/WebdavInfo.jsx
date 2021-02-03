import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./WebdavInfo.styl')

export const WebdavInfo = props => (
  <div className={`webdavInfo ${props.customClass}`}>
    <div className='webdavInfo__header subTitle'>Webdav</div>

    <div className='webdavInfo__content'>
      <div className='webdavInfo__content__text'>
        <div>
          {props.introText}
          <a
            className='webdavInfo__content__text__help primaryColorFont primaryColorFontDarkenHover'
            href='https://github.com/tracim/tracim/issues/1674'
            target='_blank'
            rel='noopener noreferrer'
          >
            {props.webdavText}
          </a>
        </div>
      </div>

      <div className='webdavInfo__content__link'>
        <div className='webdavInfo__content__link__icon primaryColorBorder'>
          <i className='far fa-hdd' />
        </div>

        <div className='webdavInfo__content__link__url primaryColorBorder'>
          {props.webdavUrl}
        </div>
      </div>
    </div>
  </div>
)

export default translate()(WebdavInfo)

WebdavInfo.propTypes = {
  introText: PropTypes.string,
  webdavText: PropTypes.string,
  agendaUrl: PropTypes.string
}

WebdavInfo.defaultProps = {
  introText: '',
  agendaUrl: ''
}
