import * as THREE from 'three'
import { XYZLoader } from './XYZLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

// INFO - CH - 2025-04-08 - Dynamic import are mandatory because unit test cannot load wasm
const webE57LibPromise = import('web-e57')

export const loadObj = (contentRawUrl, scene, camera, object, render) => {
  const loader = new OBJLoader()
  loader.load(
    contentRawUrl,
    function (newObject) {
      const ambientLight = new THREE.AmbientLight(0xffffff)
      scene.add(ambientLight)

      const pointLight = new THREE.PointLight(0xffffff, 15)
      camera.add(pointLight)

      object = newObject
      scene.add(object)

      render()
    }
  )
}

export const loadE57 = async (contentRawUrl, scene, camera, render) => {
  async function convertE57ToXYZ (fileE57) {
    const data = await fileE57.arrayBuffer()
    const dataArray = new Uint8Array(data)
    const webE57Lib = await webE57LibPromise
    return webE57Lib.convertE57(dataArray, 'XYZ')
    // return new Blob([convertedData])
  }

  const fileE57Promise = await fetch(contentRawUrl)

  const fileXYZ = await convertE57ToXYZ(fileE57Promise)

  const loader = new XYZLoader()
  loader.loadFile(
    fileXYZ,
    function (geometry) {
      geometry.center()

      const vertexColors = geometry.hasAttribute('color') === true

      const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors })

      const points = new THREE.Points(geometry, material)
      scene.add(points)
    }
  )
}

export const loadXYZ = async (contentRawUrl, scene, camera, render) => {
  const loader = new XYZLoader()
  loader.loadUrl(
    contentRawUrl,
    function (geometry) {
      geometry.center()

      const vertexColors = geometry.hasAttribute('color') === true

      const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors })

      const points = new THREE.Points(geometry, material)
      scene.add(points)
    }
  )
}
