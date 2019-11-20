import React from 'react'
import PropTypes from 'prop-types'

class MainPreview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      rotationStyle: 0
    }
  }

  rotateImg () {
    console.log('rotate')
    this.setState((prevState) => ({
      rotation: prevState.rotation === 270 ? 0 : prevState.rotation + 90
    }))
  }

  render () {
    const { props, state } = this

    return (
      <div className='carousel__item__preview'>
        <span className='carousel__item__preview__content'>
          <div className='carousel__item__preview__content__image' style={{ transform: `rotate(${state.rotation}deg)` }}>
            <img src={props.previewSrc} onClick={() => props.handleClickShowImageRaw(props.index)}
                 />
          </div>
          <div className='carousel__item__preview__content__bottom'>
            {props.loggedUser.userRoleIdInWorkspace >= 4 &&
              <button className={'btn iconBtn'} onClick={() => {props.onFileDeleted(props.index)}} title={'Supprimer'}>
                <i className={'fa fa-fw fa-trash'}></i>
              </button>
            }
              <button className={'btn iconBtn'} onClick={this.rotateImg.bind(this)}>
              <i className={'fa fa-fw fa-undo'}></i>
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
