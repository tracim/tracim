import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import PropTypes from 'prop-types'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

class Thumbnail extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidUpdate() {
    console.log('DEBUG', this.props.currentSlide)
    this.slider.slickGoTo(this.props.currentSlide, true)
  }

  render() {
    const { props } = this

    console.log(props.currentSlide)

    const settings = {
      dots: false,
      infinite: false,
      speed: 500,
      slidesToShow: 5,
      slidesToScroll: 1,
      centerMode: true,
      lazyLoad: 'ondemand',
      centerMode: true
    }

    return (
      <Slider ref={slider => (this.slider = slider)} {...settings}>
        {props.slides.map((slide, index) => (
          <div className='thumbnail__item__preview'>
            <img src={slide.previewUrlForThumbnail} onClick={() => props.handleCLickThumbnailItem(index)}/>
          </div>
        ))}
      </Slider>
    )
  }
}

export default Thumbnail

Thumbnail.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {}
}
