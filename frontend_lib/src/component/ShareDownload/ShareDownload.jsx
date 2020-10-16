import React from 'react'
import NewShareDownload from './NewShareDownload.jsx'
import ShareDownloadManagement from './ShareDownloadManagement.jsx'

class ShareDownload extends React.Component {
  constructor (props) {
    super(props)

    this.SHARE_STATUS = {
      NEW_SHARE: 'newShare',
      SHARE_MANAGE: 'management'
    }

    this.state = {
      currentPageStatus: this.SHARE_STATUS.SHARE_MANAGE
    }
  }

  componentDidMount () {
    if (this.props.shareLinkList.length === 0) {
      this.setState({ currentPageStatus: this.SHARE_STATUS.NEW_SHARE })
    }
  }

  handleNewShareDownload = () => {
    this.setState({ currentPageStatus: this.SHARE_STATUS.NEW_SHARE })
  }

  handleClickCancelButton = () => {
    this.props.onChangeEmails({ target: { value: '' } })
    this.props.onChangePassword({ target: { value: '' } })
    this.setState({ currentPageStatus: this.SHARE_STATUS.SHARE_MANAGE })
  }

  handleNewShare = async isPasswordActive => {
    const { props } = this

    if (await props.onClickNewShare(isPasswordActive)) {
      this.setState({ currentPageStatus: this.SHARE_STATUS.SHARE_MANAGE })
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='shareDownload'>
        {state.currentPageStatus === this.SHARE_STATUS.SHARE_MANAGE
          ? (
            <ShareDownloadManagement
              userRoleIdInWorkspace={props.userRoleIdInWorkspace}
              shareLinkList={props.shareLinkList}
              label={props.label}
              hexcolor={props.hexcolor}
              onClickDeleteShareLink={props.onClickDeleteShareLink}
              onClickNewShareDownload={this.handleNewShareDownload}
            />
          )
          : (
            <NewShareDownload
              hexcolor={props.hexcolor}
              onClickCancelButton={this.handleClickCancelButton}
              shareEmails={props.shareEmails}
              onChangeEmails={props.onChangeEmails}
              onKeyDownEnter={props.onKeyDownEnter}
              sharePassword={props.sharePassword}
              onChangePassword={props.onChangePassword}
              onClickNewShare={this.handleNewShare}
              emailNotifActivated={props.emailNotifActivated}
            />
          )}
      </div>
    )
  }
}

export default ShareDownload
