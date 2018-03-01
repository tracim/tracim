import React, { Component } from 'react'

// Côme - 2018/03/01 - DEPRECATED - this component has been added to tracim_lib
class BtnSwitch extends Component {
  render () {
    return (
      <div className='btnswitch'>
        <label className='switch nomarginlabel'>
          <input type='checkbox' />
          <span className='slider round' />
        </label>
        <div className='btnswitch__text'>
          On
        </div>
      </div>
    )
  }
}

export default BtnSwitch
