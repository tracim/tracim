import React from 'react'
import { translate } from 'react-i18next'
import Icon from '../Icon/Icon.jsx'

// require('./Loading.styl') // see https://github.com/tracim/tracim/issues/1156

const Loading = (props) => (
  <div className='loading'>
    <div className='loading__icon'>
      <Icon icon='fas fa-spin fa-spinner' title='' />
    </div>
    <div className='loading__text'>{props.t('Loading...')}</div>
  </div>
)

export default translate()(Loading)
