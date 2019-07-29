import React from 'react'
import PropTypes from 'prop-types'
import { withTranslation } from 'react-i18next'

require('./ErrorFlashMessageTemplateHtml.styl')

export const ErrorFlashMessageTemplateHtml = props => (
  <div className='flashMessageHtml'>
    {props.t('Unknown error, please inform an administrator')}

    <div className='flashMessageHtml__detail'>
      {props.t('Error detail')}

      <div className='flashMessageHtml__detail__msg'>
        {props.errorMsg}
      </div>
    </div>
  </div>
)

export default withTranslation()(ErrorFlashMessageTemplateHtml)

ErrorFlashMessageTemplateHtml.propTypes = {
  errorMsg: PropTypes.string
}

ErrorFlashMessageTemplateHtml.defaultProp = {
  errorMsg: ''
}
