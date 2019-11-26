import ReactImageLightbox from 'react-image-lightbox'

export class LightboxRotation {
  constructor () {
    this.angle = 0
    const parentTransform = ReactImageLightbox.getTransform
    ReactImageLightbox.getTransform = (args) => {
      const parent = parentTransform(args)
      if (this.angle !== 0) {
        parent[Object.keys(parent)[0]] += `rotate(${this.angle}deg)`
        if (this.angle === 90 || this.angle === 270) {
          let scaleFactor = 1
          if (args.width > args.height) {
            scaleFactor = args.targetHeight / args.targetWidth
          } else {
            scaleFactor += args.targetWidth / args.targetHeight
          }
          parent[Object.keys(parent)[0]] += `scale(${scaleFactor})`
        }
      }
      return parent
    }
  }

  changeAngle = (newAngle) => {
    this.angle = newAngle
  }
}

export default ReactImageLightbox
