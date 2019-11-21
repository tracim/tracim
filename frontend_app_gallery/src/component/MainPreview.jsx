import React from 'react'
import PropTypes from 'prop-types'

class MainPreview extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  rotateImg () {
    let rotationStyle
    switch (this.state.rotationStyle) {
      case (undefined):
        rotationStyle = 'rotate90'
        break
      case ('rotate90'):
        rotationStyle = 'rotate180'
        break
      case ('rotate180'):
        rotationStyle = 'rotate270'
        break
      case ('rotate270'):
        rotationStyle = undefined
        break
      default:
    }
    this.setState({ rotationStyle })
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          <div className='carousel__item__preview__content__image' style={{ transform: `rotate(${state.rotation}deg)` }}>
            <img src={props.previewSrc} className={state.rotationStyle ? state.rotationStyle : null} onClick={() => props.handleClickShowImageRaw(props.index)} />
          </div>
          <div className='carousel__item__preview__content__bottom'>
            {props.loggedUser.userRoleIdInWorkspace >= 4 && (
              <button className={'btn iconBtn'} onClick={() => props.onFileDeleted(props.index)} title={'Supprimer'}>
                <i className={'fa fa-fw fa-trash'} />
              </button>
            )}
            <button className={'btn iconBtn'} onClick={this.rotateImg.bind(this)}>
              <i className={'fa fa-fw fa-undo'} />
            </button>
          </div>
        </span>
      </div>
    )
  }
}

export default MainPreview

MainPreview.propTypes = {
  loggedUser: PropTypes.object,
  previewSrc: PropTypes.string,
  index: PropTypes.string,
  onFileDeleted: PropTypes.func,
  handleClickShowImageRaw: PropTypes.func
}
