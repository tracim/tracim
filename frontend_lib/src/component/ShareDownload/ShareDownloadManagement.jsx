import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import color from 'color'
import { CUSTOM_EVENT } from '../../customEvent.js'

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
        <div className='d-flex justify-content-between'>
          <div className='shareDownload__title'>
            {props.t(`${props.label} share`)}
          </div>
          <button
            className='btn highlightBtn my-auto'
            key='new_share_download'
            onClick={props.onClickNewShareDownload}
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
        {props.shareLinkList.length > 0
          ? props.shareLinkList.forEach(shareLink => {
              <ShareLink
                email={shareLink.email}
                link={shareLink.link}
                hexcolor={props.hexcolor}
              />
            })
          : <div className='m-auto'>No share link has been created yet.</div>
        }
      </div>
    )
  }
}

export default translate()(Radium(ShareDownloadManagement))
