import React from 'react'
import Slider from 'react-slick'
import { translate } from 'react-i18next'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import MainPreview from './MainPreview.jsx'
import PropTypes from 'prop-types'
import ThumbnailPreview from './ThumbnailPreview.jsx'
import CarouselArrow from './CarouselArrow'
import { DIRECTION } from '../helper'

export class Carousel extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      oldPosition: props.fileSelected,
      thumbnailSlider: null,
      mainSlider: null
    }
  }

  componentDidMount () {
    this.setState({
      mainSlider: this.mainSlider,
      thumbnailSlider: this.thumbnailSlider
    })
  }

  onMainSliderPositionChange (newPosition) {
    this.setState({ oldPosition: newPosition })
    this.props.onCarouselPositionChange(newPosition)
  }

  render () {
    const { props, state } = this

    if (props.slides.length === 0) {
      return props.isWorkspaceRoot
        ? <div className='gallery__noContent'>{props.t("There isn't any previewable content at that shared space's root.")}</div>
        : <div className='gallery__noContent'>{props.t("There isn't any previewable content at that folder's root.")}</div>
    }

    if (this.mainSlider && state.oldPosition !== props.fileSelected) {
      if (this.state.oldPosition === props.slides.length - 1 && props.fileSelected === 0) {
        this.mainSlider.slickNext()
      } else if (this.state.oldPosition === 0 && props.fileSelected === props.slides.length - 1) {
        this.mainSlider.slickPrev()
      } else {
        this.mainSlider.slickGoTo(props.fileSelected)
      }
    }

    const mainSliderProps = {
      asNavFor: this.state.thumbnailSlider,
      ref: slider => (this.mainSlider = slider),
      infinite: true,
      speed: props.disableAnimation ? 0 : 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: false,
      initialSlide: props.fileSelected,
      swipe: false,
      arrows: !props.disableAnimation,
      afterChange: this.onMainSliderPositionChange.bind(this),
      lazyLoad: props.autoPlay ? 'progressive' : 'ondemand',
      centerPadding: '0px',
      className: 'carousel__main',
      nextArrow: <CarouselArrow direction={DIRECTION.RIGHT} />,
      prevArrow: <CarouselArrow direction={DIRECTION.LEFT} />
    }

    const thumbnailSliderProps = {
      asNavFor: this.state.mainSlider,
      ref: slider => (this.thumbnailSlider = slider),
      slidesToShow: props.slides.length > 6 ? 7 : props.slides.length,
      focusOnSelect: true,
      initialSlide: props.fileSelected,
      swipe: false,
      lazyLoad: 'progressive',
      centerPadding: '0px',
      infinite: true,
      speed: props.disableAnimation ? 0 : 300,
      arrows: false,
      className: 'carousel__thumbnail',
      responsive: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: props.slides.length > 4 ? 5 : props.slides.length
          }
        }, {
          breakpoint: 992,
          settings: {
            slidesToShow: props.slides.length > 2 ? 3 : props.slides.length
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
              key={`mainPreview_${index}`}
              fileName={slide.fileName}
            />
          ))}
        </Slider>
        <Slider
          {...thumbnailSliderProps}
        >
          {props.slides.map((slide, i) => (
            <ThumbnailPreview
              previewSrc={slide.previewUrlForThumbnail}
              rotationAngle={slide.rotationAngle}
              key={`thumbnailPreview_${i}`}
              fileName={slide.fileName}
            />
          ))}
        </Slider>
      </>
    )
  }
}

export default translate()(Carousel)

Carousel.propTypes = {
  slides: PropTypes.array.isRequired,
  handleClickShowImageRaw: PropTypes.func.isRequired,
  fileSelected: PropTypes.number.isRequired,
  onFileDeleted: PropTypes.func.isRequired,
  loggedUser: PropTypes.object,
  disableAnimation: PropTypes.bool,
  isWorkspaceRoot: PropTypes.bool
}

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {},
  onFileDeleted: () => {},
  loggedUser: {},
  disableAnimation: false,
  fileSelected: 0,
  isWorkspaceRoot: true
}
