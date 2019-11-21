import React from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import MainPreview from './MainPreview.jsx'
import PropTypes from 'prop-types'
import ThumbnailPreview from './ThumbnailPreview.jsx'
import CarouselArrow from './CarouselArrow'
import { DIRECTION } from '../helper'

class Carousel extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      mainSlider: null,
      thumbnailSlider: null
    }
  }

  componentDidMount () {
    this.setState({
      mainSlider: this.mainSlider,
      thumbnailSlider: this.thumbnailSlider
    })
  }

  onMainSliderPositionChange (newPosition) {
    this.position = newPosition
    if (newPosition === this.props.fileSelected) return
    this.props.onCarouselPositionChange(newPosition)
  }

  render () {
    const { props } = this

    if (this.mainSlider) {
      if (this.position === props.slides.length - 1 && props.fileSelected === 0) {
        this.mainSlider.slickNext()
      } else if (this.position === 0 && props.fileSelected === props.slides.length - 1) {
        this.mainSlider.slickPrev()
      } else {
        this.mainSlider.slickGoTo(props.fileSelected)
      }
    }

    const mainSliderProps = {
      infinite: true,
      speed: props.disableAnimation ? 0 : 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true,
      swipe: false,
      lazyLoad: 'progressive',
      afterChange: this.onMainSliderPositionChange.bind(this),
      centerPadding: '0px',
      nextArrow: <CarouselArrow direction={DIRECTION.RIGHT} />,
      prevArrow: <CarouselArrow direction={DIRECTION.LEFT} />
    }

    const thumbnailSliderProps = {
      slidesToShow: props.slides.length > 6 ? 7 : props.slides.length,
      focusOnSelect: true,
      centerMode: true,
      swipe: false,
      centerPadding: '0px',
      infinite: true,
      speed: 200,
      arrows: false,
      className: 'carousel__top'
    }

    return (
      <div>
        <div>
          <Slider
            asNavFor={this.state.thumbnailSlider}
            ref={slider => (this.mainSlider = slider)}
            {...mainSliderProps}
          >
            {props.slides.map((slide, index) => (
              <MainPreview
                loggedUser={props.loggedUser}
                previewSrc={slide.src}
                index={index}
                onFileDeleted={props.onFileDeleted}
                handleClickShowImageRaw={props.handleClickShowImageRaw}
              />
            ))}
          </Slider>
        </div>
        <Slider
          asNavFor={this.state.mainSlider}
          ref={slider => (this.thumbnailSlider = slider)}
          {...thumbnailSliderProps}
        >
          {props.slides.map((slide) => (
            <ThumbnailPreview
              previewSrc={slide.previewUrlForThumbnail}
            />
          ))}
        </Slider>
      </div>
    )
  }
}

export default Carousel

Carousel.propTypes = {
  slides: PropTypes.array,
  loggedUser: PropTypes.object,
  handleClickShowImageRaw: PropTypes.func,
  onFileDeleted: PropTypes.func,
  disableAnimation: PropTypes.bool,
  fileSelected: PropTypes.number
}

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {}
}
