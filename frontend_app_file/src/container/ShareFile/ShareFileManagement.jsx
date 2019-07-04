import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

require('./ShareFile.styl')

class ShareFileManagement extends React.Component {
  constructor (props) {
    super(props)
    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<FrontendLib:ShareFileManagement> Custom event', 'color: #28a745', type, data)
        i18n.changeLanguage(data)
        break
    }
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  render () {
    const { props } = this

    return (
      <div className='share'>
        <div className='share__title'>
          {props.t('File share')}
        </div>
      </div>
    )
  }
}

export default translate()(ShareFileManagement)
