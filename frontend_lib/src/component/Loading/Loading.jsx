import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

// require('./Loading.styl') // see https://github.com/tracim/tracim/issues/1156

const Loading = (props) => (
  <div className='loader'>
    <span className='loader__spinner' style={{ height: props.height, width: props.width }} />
    <div className='loader__text'>{props.t('Loading…')}</div>
  </div>
)

export default translate()(Loading)

Loading.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number
}

Loading.defaultProps = {
  height: 24,
  width: 24
}
