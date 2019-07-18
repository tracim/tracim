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
      currentPage: this.SHARE_STATUS.SHARE_MANAGE
    }
  }

  handleNewShareDownload = () => {
    this.setState({currentPage: this.SHARE_STATUS.NEW_SHARE})
  }

  handleReturnToManagement = () => {
    this.setState({currentPage: this.SHARE_STATUS.SHARE_MANAGE})
  }

  render () {
    const { props, state } = this

    return (
      <div className='shareDownload'>
        {state.currentPage === this.SHARE_STATUS.SHARE_MANAGE
          ? <ShareDownloadManagement
            shareLinkList={props.shareLinkList}
            label={props.label}
            hexcolor={props.hexcolor}
            onClickDeleteShareLink={props.onClickDeleteShareLink}
            onClickNewShareDownload={this.handleNewShareDownload}
          />
          : <NewShareDownload
            hexcolor={props.hexcolor}
            onClickReturnToManagement={this.handleReturnToManagement}
            shareEmails={props.shareEmails}
            onChangeEmails={props.onChangeEmails}
            convertSpaceAndCommaToNewLines={props.convertSpaceAndCommaToNewLines}
            sharePassword={props.sharePassword}
            onChangePassword={props.onChangePassword}
          />
        }
      </div>
    )
  }
}

export default ShareDownload
