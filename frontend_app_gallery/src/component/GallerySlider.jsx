import Slider from 'react-slick'

// NOTE 2022-02-16 - SG - Extending Slider
// to enforce the right initial slide selection at start as 'initialIndex'
// of react-slick does not work in every case (when several slides are displayed)
// use the displayedPictureIndex prop provided by this class instead
export default class GallerySlider extends Slider {
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
}
