import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import color from 'color'
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
        console.log('%c<ShareFileManagement> Custom event', 'color: #28a745', type, data)
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
      <div className='shareFile'>
        <div className='shareFile__title'>
          {props.t('File share')}
        </div>
        <div className='d-flex ml-auto'>
          <button
            className='btn outlineTextBtn d-flex mr-3'
            key='delete_all_shares'
            style={{
              borderColor: props.hexcolor,
              ':hover': {
                backgroundColor: props.hexcolor
              }
            }}
          >
            {props.t('Delete all')}
            <i className='fa fa-fw fa-trash-o' />
          </button>
          <button
            className='btn highlightBtn'
            key='new_share_file'
            style={{
              backgroundColor: props.hexcolor,
              ':hover': {
                backgroundColor: color(props.hexcolor).darken(0.15).hexString()
              }
            }}
          >
            {props.t('New')}
            <i className='fa fa-fw fa-plus-circle' />
          </button>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(ShareFileManagement))
