import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import { Carousel as CarouselLib } from 'react-responsive-carousel';
import PropTypes from 'prop-types'
import PreviewComponent from './PreviewComponent.jsx'

class Carousel extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { props } = this

    return (
      <CarouselLib
        showThumbs={false}
        showIndicators={false}
        onChange={props.onCarouselPositionChange}
        onClickItem={props.handleClickShowImageRaw}
        selectedItem={props.selectedItem}
        width='50%'
      >
        {props.slides.map((slide, index) => (
          <PreviewComponent
            preview={slide}
          />
        ))}
      </CarouselLib>
    )
  }
}

export default Carousel

Carousel.defaultProps = {
  slides: [],
  onCarouselPositionChange: () => {},
  handleClickShowImageRaw: () => {}
}
