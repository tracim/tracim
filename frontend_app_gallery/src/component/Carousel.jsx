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
      oldPosition: 0
    }
  }

  onMainSliderPositionChange (newPosition) {
    this.setState({ oldPosition: newPosition })
    this.props.onCarouselPositionChange(newPosition)
  }

  render () {
    const { props } = this

    if (this.mainSlider) {
      if (this.state.oldPosition === props.slides.length - 1 && props.fileSelected === 0) {
        this.mainSlider.slickNext()
      } else if (this.state.oldPosition === 0 && props.fileSelected === props.slides.length - 1) {
        this.mainSlider.slickPrev()
      } else {
        this.mainSlider.slickGoTo(props.fileSelected)
      }
    }

    const mainSliderProps = {
      asNavFor: this.thumbnailSlider,
      ref: slider => (this.mainSlider = slider),
      infinite: true,
      speed: props.disableAnimation ? 0 : 400,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true,
      swipe: false,
      arrows: !props.disableAnimation,
      lazyLoad: 'progressive',
      afterChange: this.onMainSliderPositionChange.bind(this),
      centerPadding: '0px',
      className: 'carousel__main',
      nextArrow: <CarouselArrow direction={DIRECTION.RIGHT} />,
      prevArrow: <CarouselArrow direction={DIRECTION.LEFT} />
    }

    const thumbnailSliderProps = {
      asNavFor: this.mainSlider,
      ref: slider => (this.thumbnailSlider = slider),
      slidesToShow: props.slides.length > 6 ? 7 : props.slides.length,
      focusOnSelect: true,
      centerMode: true,
      swipe: false,
      centerPadding: '0px',
      infinite: true,
      speed: props.disableAnimation ? 0 : 400,
      arrows: false,
      className: 'carousel__thumbnail',
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 5
          }
        }, {
          breakpoint: 991,
          settings: {
            slidesToShow: 3
          }
        }
      ]
    }

    return (
      <>
        <Slider
          {...mainSliderProps}
        >
          {props.slides.map((slide, index) => (
            <MainPreview
              loggedUser={props.loggedUser}
              previewSrc={slide.src}
              index={index}
              handleClickShowImageRaw={props.handleClickShowImageRaw}
              rotationAngle={slide.rotationAngle}
            />
          ))}
        </Slider>
        <Slider
          {...thumbnailSliderProps}
        >
          {props.slides.map((slide) => (
            <ThumbnailPreview
              previewSrc={slide.previewUrlForThumbnail}
              rotationAngle={slide.rotationAngle}
            />
          ))}
        </Slider>
      </>
    )
  }
}

export default Carousel

Carousel.propTypes = {
  slides: PropTypes.array.isRequired,
  handleClickShowImageRaw: PropTypes.func.isRequired,
  fileSelected: PropTypes.number.isRequired,
  onFileDeleted: PropTypes.func.isRequired,
  loggedUser: PropTypes.object,
  disableAnimation: PropTypes.bool
}

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {},
  onFileDeleted: () => {},
  loggedUser: {},
  disableAnimation: false,
  fileSlected: 0
}
