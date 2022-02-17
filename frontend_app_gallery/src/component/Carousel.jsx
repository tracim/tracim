import React from 'react'
import i18next from 'i18next'
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

  componentDidUpdate (prevProps) {
    // INFO - SG  - 2022-02-17 - SG - avoid changing the position if index are equal
    // as react-slick will trigger an afterChange callback in this case (which will lead
    // to an update loop)
    if (prevProps.displayedPictureIndex === this.props.displayedPictureIndex) return
    this.setPositionFor('main', this.props.displayedPictureIndex)
    this.setPositionFor('thumbnails', this.props.displayedPictureIndex)
  }

  setPositionFor (component, position) {
    const positionWithDirection = this.reverseIndexWhenRtl(position)
    this.components[component] && this.components[component].slickGoTo(positionWithDirection)
  }

  onPositionChange = newIndex => {
    this.props.onCarouselPositionChange(this.reverseIndexWhenRtl(newIndex))
  }

  reverseIndexWhenRtl = (index) => {
    return i18next.dir() === 'rtl' ? this.props.slides.length - 1 - index : index
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
      centerMode: true,
      swipe: false,
      arrows: !props.disableAnimation && !props.autoPlay,
      afterChange: this.onPositionChange,
      centerPadding: '0px',
      className: 'carousel__main',
      lazyLoad: props.autoPlay ? 'progressive' : 'ondemand',
      nextArrow: <CarouselArrow direction={DIRECTION.RIGHT} />,
      prevArrow: <CarouselArrow direction={DIRECTION.LEFT} />
    }

    const thumbnailSliderProps = {
      ref: r => { this.components.thumbnails = r },
      slidesToShow: props.slides.length > 6 ? 7 : props.slides.length,
      focusOnSelect: !props.autoPlay,
      afterChange: this.onPositionChange,
      swipe: false,
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

    // INFO - SG - 2022-02-16 - The support of RTL in react-slick is very buggy
    // so do not use it and ensure a reverse of the slides list.
    // Also adapt props.displayedPictureIndex to be invariant to direction changes outside this component.
    const slides = i18next.dir() === 'rtl' ? props.slides.slice().reverse() : props.slides

    return (
      <>
        <GallerySlider {...mainSliderProps} displayedPictureIndex={this.reverseIndexWhenRtl(0)}>
          {slides.map((slide, index) => (
            <MainPreview
              previewSrc={slide.src}
              onClickShowImageRaw={props.onClickShowImageRaw}
              rotationAngle={slide.rotationAngle}
              fileName={slide.fileName}
              key={slide.contentId}
            />
          ))}
        </GallerySlider>
        <GallerySlider {...thumbnailSliderProps} displayedPictureIndex={this.reverseIndexWhenRtl(0)}>
          {slides.map(slide => (
            <ThumbnailPreview
              previewSrc={slide.previewUrlForThumbnail}
              rotationAngle={slide.rotationAngle}
              onClickShowImageRaw={props.onClickShowImageRaw}
              fileName={slide.fileName}
              key={slide.contentId}
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
