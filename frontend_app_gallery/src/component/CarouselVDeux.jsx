import React from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import classnames from 'classnames'
import MainPreview from './MainPreview.jsx'
import PropTypes from 'prop-types'
import ThumbnailPreview from './ThumbnailPreview.jsx'

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
    this.autoPlay = false
  }

  componentDidMount() {
    this.setState({
      nav1: this.mainSlider,
      nav2: this.thumbnailSlider
    })
  }

  onMainSliderPositionChange(newPosition) {
    console.log('newPosition : ', newPosition)
    if (newPosition === this.props.fileSelected) return
    this.props.onCarouselPositionChange(newPosition)
  }

  onSlickPlayClick (play) {
    this.autoPlay = play
    if (play) {
      this.mainSlider.slickPlay()
    } else {
      this.mainSlider.slickPause()
    }
  }

  render() {
    const { props } = this

    // if (this.mainSlider && !this.autoPlay) this.mainSlider.slickGoTo(props.fileSelected)

    const settings = {
      infinite: true,
      speed: props.disableAnimation ? 0 : 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true,
      swipe: false,
      lazyLoad: 'progressive',
      afterChange: this.onMainSliderPositionChange.bind(this),
      centerPadding: '0px',
      nextArrow: <SampleNextArrow />,
      prevArrow: <SamplePrevArrow />,
      autoplaySpeed: 1000,
      autoPlay: this.autoPlay
    }

    return (
      <div>
        <div>
          <button onClick={() => this.onSlickPlayClick(true)}>PLAY</button>
          <button onClick={() => this.onSlickPlayClick(false)}>Pause</button>
          <Slider
            asNavFor={this.state.nav2}
            ref={slider => (this.mainSlider = slider)}
            {...settings}
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
          asNavFor={this.state.nav1}
          ref={slider => (this.thumbnailSlider = slider)}
          slidesToShow={props.slides.length > 6 ? 7 : props.slides.length}
          focusOnSelect
          centerMode
          swipe={false}
          centerPadding={'0px'}
          infinite={true}
          speed={200}
          arrows={false}
          className={'carousel__top'}
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

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {}
}
