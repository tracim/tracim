import React, { Component } from 'react'

class EditContent extends Component {
  render () {
    return (
      <div className='d-flex align-items-center'>
        <div className='wsContentGeneric__option__menu__action optionicon d-none d-sm-block'>
          <i className='fa fa-fw fa-archive' />
        </div>
        <div className='wsContentGeneric__option__menu__action optionicon d-none d-sm-block'>
          <i className='fa fa-fw fa-trash' />
        </div>
      </div>
    )
  }
}

export default EditContent
