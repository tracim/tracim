import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import { CUSTOM_EVENT } from '../../customEvent.js'
import ShareLink from '../ShareLink/ShareLink.jsx'
import { ROLE } from '../../helper.js'

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
    const shareLinkList = props.shareLinkList ? props.shareLinkList : []

    return (
      <>
        <div className='shareDownload__management__header'>
          <div className='shareDownload__title'>
            {props.t('{{label}} share', { label: props.label, interpolation: { escapeValue: false } })}
          </div>
          {props.userRoleIdInWorkspace >= ROLE.contentManager.id &&
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
              <i className='fas fa-fw fa-plus-circle' />
            </button>}
        </div>

        {shareLinkList.length > 0 && props.userRoleIdInWorkspace >= ROLE.contributor.id &&
          shareLinkList.map(shareLink =>
            <ShareLink
              key={shareLink.share_id}
              email={shareLink.email}
              link={shareLink.url}
              id={shareLink.share_id}
              isProtected={shareLink.has_password}
              onClickDeleteShareLink={props.onClickDeleteShareLink}
              hexcolor={props.hexcolor}
              userRoleIdInWorkspace={props.userRoleIdInWorkspace}
            />
          )}

        {shareLinkList.length <= 0 &&
          <div className='m-auto'>{props.t('No share link has been created yet')}</div>}
      </>
    )
  }
}

export default translate()(Radium(ShareDownloadManagement))
