import React, { Component } from 'react'

class ProgressBar extends Component {
  render () {
    return (
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-md-3 col-sm-6'>
            <div className='progress blue'>
              <span className='progress-left'>
                <span className='progress-bar' />
              </span>
              <span className='progress-right'>
                <span className='progress-bar' />
              </span>
              <div className='progress-value primaryColorBg'>
                90%
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ProgressBar
