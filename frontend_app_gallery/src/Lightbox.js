import ReactImageLightbox from 'react-image-lightbox'

let angle

export const changeAngle = (newAngle) => {
  angle = newAngle
}

const parentTransform = ReactImageLightbox.getTransform
ReactImageLightbox.getTransform = (args) => {
  const parent = parentTransform(args)
  if (angle !== 0) {
    parent[Object.keys(parent)[0]] += `rotate(${angle}deg)`
    if (angle === 90 || angle === 270) {
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

export default ReactImageLightbox
