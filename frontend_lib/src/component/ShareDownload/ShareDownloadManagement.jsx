import React from 'react'
import { withTranslation } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import { CUSTOM_EVENT } from '../../customEvent.js'
import ShareLink from '../ShareLink/ShareLink.jsx'

const color = require('color')

class ShareDownloadManagement extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<ShareDownloadManagement> Custom event', 'color: #28a745', type, data)
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
      <div className='shareDownload'>
        <div className='shareDownload__management__header'>
          <div className='shareDownload__title'>
            {props.t('{{label}} share', {label: props.label, interpolation: {escapeValue: false}})}
          </div>
          {props.userRoleIdInWorkspace >= 4 &&
            <button
              className='shareDownload__btn btn highlightBtn'
              key='newShareDownload'
              onClick={props.onClickNewShareDownload}
              style={{
                backgroundColor: props.hexcolor,
                ':hover': {
                  backgroundColor: color(props.hexcolor).darken(0.15).hex()
                }
              }}
            >
              {props.t('New')}
              <i className='fa fa-fw fa-plus-circle' />
            </button>
          }
        </div>
        {props.shareLinkList.length > 0
          ? props.userRoleIdInWorkspace >= 4
            ? props.shareLinkList.map(shareLink =>
                <ShareLink
                  email={shareLink.email}
                  link={shareLink.link}
                  id={shareLink.id}
                  isProtected={shareLink.isProtected}
                  onClickDeleteShareLink={props.onClickDeleteShareLink}
                  hexcolor={props.hexcolor}
                />
              )
            : <div className='m-auto'>{props.t('This file has {{numberLinks}} share links', { numberLinks: props.shareLinkList.length })}</div>
          : <div className='m-auto'>{props.t('No share link has been created yet')}</div>
        }
      </div>
    )
  }
}

export default withTranslation()(Radium(ShareDownloadManagement))
