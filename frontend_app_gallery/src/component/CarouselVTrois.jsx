import React from 'react'
import 'react-image-gallery/styles/css/image-gallery.css'
// import 'react-image-gallery/styles/scss/image-gallery.scss'
import ImageGallery from 'react-image-gallery';

class Carousel extends React.Component {
  constructor(props) {
    super(props)
    // this.state = {
    //   images: props.slides.map((s, index) => ({
    //             original: s.src,
    //             thumbnail: s.previewUrlForThumbnail
    //           }))
    // }

  }

  render() {
    const images = this.props.slides.map((s, index) => ({
      original: s.src,
      thumbnail: s.lightBoxUrlList[0],
      sizes: { height: 500, width: 700 },
      originalClass: 'originalClassVTrois'
    }))
    return (
      <ImageGallery
        items={images}
        lazyLoad
      />
    )
  }
}

export default Carousel
