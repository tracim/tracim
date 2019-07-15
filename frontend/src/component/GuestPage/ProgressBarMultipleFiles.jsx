import React from 'react'

require('./ProgressBarMultipleFiles.styl')

export const ProgressBarMultipleFiles = props => {
  // const intPercent = parseInt(props.percent)
  // const rotateLeft = intPercent <= 50 ? 0 : (intPercent - 50) / 100 * 360
  // const rotateRight = intPercent >= 50 ? 180 : intPercent / 100 * 360
  return (
    props.fileList.map(file =>
      <div className='progressMultipleFiles' key={file.name}>
        <i className='progressMultipleFiles__icon primaryColorFont fa fa-fw fa-paperclip' />
        <div>
          <div className='d-flex justify-content-between'>
            {file.name}
            <div>progress</div>
          </div>
          <div className='progressMultipleFiles__bar' />
        </div>
        <i className='progressMultipleFiles__status primaryColorFont fa fa-fw fa-check' />
      </div>
    )
    /* <span className='progressMultipleFiles-left'>
      <span className='progressMultipleFiles-bar' style={{transform: `rotate(${rotateLeft}deg)`}} />
    </span>

    <span className='progressMultipleFiles-right'>
      <span className='progressMultipleFiles-bar' style={{transform: `rotate(${rotateRight}deg)`}} />
    </span>

    <div className='progressMultipleFiles-value' style={{backgroundColor: props.color}}>
      {props.percent}%
    </div> */
  )
}

export default ProgressBarMultipleFiles
