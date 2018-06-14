import React from 'react'
import { CardPopupCreateContent } from 'tracim_lib'

class PopupCreatePageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newContentName: ''
    }
  }

  handleChangeNewContentName = e => this.setState({newContentName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent',
    data: {
      name: 'PageHtml'
    }
  })

  handleValidate = () => {
    console.log(`fetch(/workspace/:id/content, POST, body:{name: ${this.state.newContentName})`)
    // API return the id of the new content
    this.handleClose()
    GLOBAL_dispatchEvent({
      type: 'openContentUrl',
      data: {
        idWorkspace: this.props.data.folder.workspace_id,
        idContent: '1' // will the id returned by api
      }
    })
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        title={this.props.data.config.label.fr} // @TODO get the lang of user
        color={this.props.data.config.color}
        icon={this.props.data.config.icon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel='Valider et créer'
      />
    )
  }
}

export default PopupCreatePageHtml
