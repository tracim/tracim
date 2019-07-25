import React from 'react'
import { withTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

require('./AgendaInfo.styl')

export const AgendaInfo = props => (
  <div className={`agendaInfo ${props.customClass}`}>
    <div className='agendaInfo__header subTitle'>
      {props.t('Agenda')}
    </div>

    <div className='agendaInfo__content'>
      <div className='agendaInfo__content__text'>
        <div>
          {props.introText}
          <a
            className='agendaInfo__content__text__help primaryColorFont primaryColorFontDarkenHover'
            href='https://github.com/tracim/tracim/issues/1673'
            target='_blank'
          >
            {props.caldavText}
          </a>
        </div>
      </div>

      <div className='agendaInfo__content__link'>
        <div className='agendaInfo__content__link__icon primaryColorBorder'>
          <i className='fa fa-calendar' />
        </div>

        <div className='agendaInfo__content__link__url primaryColorBorder'>
          {props.agendaUrl}
        </div>
      </div>
    </div>
  </div>
)

export default withTranslation()(AgendaInfo)

AgendaInfo.propTypes = {
  introText: PropTypes.string,
  caldavText: PropTypes.string,
  agendaUrl: PropTypes.string
}

AgendaInfo.defaultProps = {
  introText: '',
  caldavText: '',
  agendaUrl: ''
}
