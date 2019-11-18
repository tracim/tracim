import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import PropTypes from 'prop-types'
import PreviewComponent from './PreviewComponent.jsx'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import classnames from 'classnames'
import { DIRECTION } from '../helper'

function SampleNextArrow(props) {
  const { className, style, onClick } = props
  return (
    <div
      className={classnames(className, 'fa', 'fa-chevron-right')}
      style={{ ...style, display: "block" }}
      onClick={onClick}
    />
  )
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props
  return (
    <div
      className={classnames(className, 'fa', 'fa-chevron-left')}
      style={{ display: "block" }}
      onClick={onClick}
    />
  )
}

class Carousel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      nav1: null,
      nav2: null
    }
  }

  componentDidMount() {
    this.setState({
      nav1: this.mainSlider,
      nav2: this.thumbnailSlider
    })
  }

  goToSlide(index) {
    // this.mainSlider.slickGoTo(index, false)
    // this.props.onCarouselPositionChange(index)
    // this.thumbnailSlider.slickGoTo(index, false)
  }

  onMainSliderPositionChange(oldPosition, newPosition) {
    // this.thumbnailSlider.slickGoTo(position, true)
    this.props.onCarouselPositionChange(newPosition)
  }

  render() {
    const { props } = this
    console.log('RENDER', props.selectedItem)
    const settings = {
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true,
      swipe: false,
      lazyLoad: 'progressive',
      beforeChange: this.onMainSliderPositionChange.bind(this),
      centerPadding: '0px',
      nextArrow: <SampleNextArrow />,
      prevArrow: <SamplePrevArrow />
    }
    // , props.selectedItem === index ? 'thumbnail__item__preview__content__selected' : null

    return (
      <div>
        <div>
          <Slider
            asNavFor={this.state.nav2}
            ref={slider => (this.mainSlider = slider)}
            {...settings}
          >
            {props.slides.map((slide, index) => (
              <div className='carousel__item__preview'>
                <span class='carousel__item__preview__content'>
                  <img src={slide.src} onClick={() => props.handleClickShowImageRaw(index)}/>
                  {/*<p className="carousel__item__preview__legend">{slide.fileName}</p>*/}
                </span>
              </div>
            ))}
          </Slider>
        </div>
        <Slider
          asNavFor={this.state.nav1}
          ref={slider => (this.thumbnailSlider = slider)}
          slidesToShow={7}
          focusOnSelect
          centerMode
          swipe={false}
          centerPadding={'0px'}
          infinite
          speed={200}
          arrows={false}
        >
          {props.slides.map((slide, index) => (
            <div className={'thumbnail__item__preview__content'} onClick={() => this.goToSlide(index)}>
              <div className={classnames('thumbnail__item__preview__content__image', props.selectedItem === index ? 'thumbnail__item__preview__content__image__selected' : null)}>
              <img src={slide.previewUrlForThumbnail} />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    )
  }
}

export default Carousel

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {}
}
