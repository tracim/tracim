import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import { CUSTOM_EVENT } from '../../customEvent.js'
import ShareLink from '../ShareLink/ShareLink.jsx'
import { ROLE } from '../../helperConstants.js'
import IconButton from '../Button/IconButton.jsx'

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
          {props.userRoleIdInWorkspace >= ROLE.contentManager.id && (
            <IconButton
              color={props.hexcolor}
              customClass='shareDownload__btn'
              key='newShareDownload'
              icon='fas fa-plus-circle'
              intent='primary'
              mode='light'
              onClick={props.onClickNewShareDownload}
              text={props.t('New')}
            />
          )}
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
          <div>{props.t('No share link has been created yet')}</div>}
      </>
    )
  }
}

export default translate()(Radium(ShareDownloadManagement))
