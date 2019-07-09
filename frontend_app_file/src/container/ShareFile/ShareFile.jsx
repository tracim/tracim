import React from 'react'
import NewShareFile from './NewShareFile.jsx'
import ShareFileManagement from './ShareFileManagement.jsx'

require('./ShareFile.styl')

class ShareFile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      currentPage: 'management'
    }
  }

  handleNewShareFile = () => {
    this.setState({currentPage: 'newShare'})
  }

  handleReturnToManagement = () => {
    this.setState({currentPage: 'management'})
  }

  render () {
    const { props } = this

    return (
      <div className='shareFile'>
        {this.state.currentPage === 'management'
          ? <ShareFileManagement
            hexcolor={props.hexcolor}
            onClickNewShareFile={this.handleNewShareFile}
          />
          : <NewShareFile
            hexcolor={props.hexcolor}
            onClickReturnToManagement={this.handleReturnToManagement}
          />
        }
      </div>
    )
  }
}

export default ShareFile
