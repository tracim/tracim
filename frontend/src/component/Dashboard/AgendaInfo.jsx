import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

require('./AgendaInfo.styl')

export const AgendaInfo = props => (
  <div className='agendaInfo'>
    <div className='agendaInfo__header subTitle'>
      {props.t('Agenda')}
    </div>

    <div className='agendaInfo__content'>
      <div className='agendaInfo__content__text'>
        {props.t('Use this link to access this shared space agenda from anyhere')}
      </div>

      <div className='agendaInfo__content__link'>
        {props.agendaUrl}
      </div>
    </div>
  </div>
)

export default translate()(AgendaInfo)

AgendaInfo.propTypes = {
  agendaUrl: PropTypes.string
}

AgendaInfo.defaultProps = {
  agendaUrl: ''
}
