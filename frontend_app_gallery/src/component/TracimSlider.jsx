import Slider from 'react-slick'

export default class TracimSlider extends Slider {
  constructor (props) {
    super(props)

    const origInnerSliderRefHandler = this.innerSliderRefHandler
    this.innerSliderRefHandler = (ref) => {
      origInnerSliderRefHandler(ref)
      if (this.props.displayedPictureIndex) {
        this.innerSlider.slickGoTo(this.props.displayedPictureIndex)
      }
    }
  }

  setDisplayedPictureIndex = index => {
    if (this.innerSlider) {
      this.innerSlider.slickGoTo(index)
    }
  }
}
