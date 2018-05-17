import React, { Component } from 'react'

class NewVersionBtn extends Component {
  render () {
    return (
      <div
        className='wsContentGeneric__option__menu__addversion newversionbtn btn btn-outline-primary mr-auto'
        onClick={this.props.onClickNewVersionBtn}
      >
        Nouvelle version
        <i className='fa fa-plus-circle ml-3' />
      </div>
    )
  }
}

export default NewVersionBtn
