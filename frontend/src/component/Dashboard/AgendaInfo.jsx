import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./AgendaInfo.styl')

export const AgendaInfo = props => (
  <div className={`agendaInfo ${props.customClass}`}>
    <div className='agendaInfo__header subTitle'>
      {props.t('Agenda')}
    </div>

    <div className='agendaInfo__content'>
      <div className='agendaInfo__content__text'>
        {props.introText}
      </div>

      <div className='agendaInfo__content__link'>
        <div className='agendaInfo__content__link__icon'>
          <i className='fa fa-calendar' />
        </div>

        <div className='agendaInfo__content__link__url'>
          {props.agendaUrl}
        </div>
      </div>
    </div>
  </div>
)

export default translate()(AgendaInfo)

AgendaInfo.propTypes = {
  introText: PropTypes.string,
  agendaUrl: PropTypes.string
}

AgendaInfo.defaultProps = {
  introText: '',
  agendaUrl: ''
}
