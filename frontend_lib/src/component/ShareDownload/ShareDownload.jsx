import React from 'react'
import NewShareDownload from './NewShareDownload.jsx'
import ShareDownloadManagement from './ShareDownloadManagement.jsx'

class ShareDownload extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentPage: 'management'
    }
  }

  handleNewShareDownload = () => {
    this.setState({currentPage: 'newShare'})
  }

  handleReturnToManagement = () => {
    this.setState({currentPage: 'management'})
  }

  render () {
    const { props, state } = this

    return (
      <div className='shareDownload'>
        {state.currentPage === 'management'
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
