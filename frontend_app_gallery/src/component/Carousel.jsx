import React from 'react'
import { translate } from 'react-i18next'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import GallerySlider from './GallerySlider.jsx'
import MainPreview from './MainPreview.jsx'
import PropTypes from 'prop-types'
import ThumbnailPreview from './ThumbnailPreview.jsx'
import CarouselArrow from './CarouselArrow.jsx'
import { DIRECTION } from '../helper'

export class Carousel extends React.Component {
  constructor (props) {
    super(props)
    this.components = {}
  }

  componentDidUpdate () {
    this.setPositionFor('main', this.props.displayedPictureIndex)
    this.setPositionFor('thumbnails', this.props.displayedPictureIndex)
  }

  setPositionFor (component, position) {
    this.components[component] && this.components[component].setDisplayedPictureIndex(position)
  }

  onPositionChange = (newIndex) => {
    this.props.onCarouselPositionChange(newIndex)
  }

  render () {
    const { props } = this

    if (props.slides.length === 0) {
      return props.isWorkspaceRoot
        ? <div className='gallery__noContent'>{props.t("There isn't any previewable content at that space's root.")}</div>
        : <div className='gallery__noContent'>{props.t("There isn't any previewable content at that folder's root.")}</div>
    }

    const mainSliderProps = {
      ref: slider => { this.components.main = slider },
      infinite: true,
      speed: props.disableAnimation ? 0 : 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: false,
      initialSlide: 0,
      swipe: false,
      arrows: !props.disableAnimation && !props.autoPlay,
      afterChange: this.onPositionChange,
      beforeChange: (oldIndex, newIndex) => this.setPositionFor('thumbnails', newIndex),
      lazyLoad: props.autoPlay ? 'progressive' : 'ondemand',
      centerPadding: '0px',
      className: 'carousel__main',
      nextArrow: <CarouselArrow direction={DIRECTION.RIGHT} />,
      prevArrow: <CarouselArrow direction={DIRECTION.LEFT} />
    }

    const thumbnailSliderProps = {
      ref: r => { this.components.thumbnails = r },
      slidesToShow: props.slides.length > 6 ? 7 : props.slides.length,
      focusOnSelect: !props.autoPlay,
      initialSlide: 0,
      beforeChange: (oldIndex, newIndex) => this.setPositionFor('main', newIndex),
      afterChange: this.onPositionChange,
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
        <GallerySlider {...mainSliderProps}>
          {props.slides.map((slide, index) => (
            <MainPreview
              previewSrc={slide.src}
              index={index}
              onClickShowImageRaw={props.onClickShowImageRaw}
              rotationAngle={slide.rotationAngle}
              key={slide.src}
              fileName={slide.fileName}
            />
          ))}
        </GallerySlider>
        <GallerySlider {...thumbnailSliderProps}>
          {props.slides.map((slide, i) => (
            <ThumbnailPreview
              previewSrc={slide.previewUrlForThumbnail}
              rotationAngle={slide.rotationAngle}
              onClickShowImageRaw={props.onClickShowImageRaw}
              key={slide.src}
              fileName={slide.fileName}
            />
          ))}
        </GallerySlider>
      </>
    )
  }
}

export default translate()(Carousel)

Carousel.propTypes = {
  slides: PropTypes.array.isRequired,
  onClickShowImageRaw: PropTypes.func.isRequired,
  displayedPictureIndex: PropTypes.number.isRequired,
  onFileDeleted: PropTypes.func.isRequired,
  disableAnimation: PropTypes.bool,
  isWorkspaceRoot: PropTypes.bool
}

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  onClickShowImageRaw: () => {},
  onFileDeleted: () => {},
  disableAnimation: false,
  displayedPictureIndex: 0,
  isWorkspaceRoot: true
}
