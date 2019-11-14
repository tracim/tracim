import React from 'react'

export class PreviewComponent extends React.Component {
  constructor(props) {
    super(props)
  }

  render () {
    const {props, state} = this

    return (
      <div className='carousel__item__preview'>
        <img src={props.preview.src} />
        <p className="carousel__item__preview__legend">{props.preview.fileName}</p>
      </div>
    )
  }
}
export default PreviewComponent
