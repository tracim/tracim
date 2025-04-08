import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import * as THREE from 'three'
import { XYZLoader } from './XYZLoader.js'

require('./PointCloudViewer.styl')

// INFO - CH - 2025-04-08 - Dynamic import are mandatory because unit test cannot load wasm
const webE57LibPromise = import('web-e57')
const OrbitControlsLibPromise = import('three/examples/jsm/controls/OrbitControls.js')

async function convertE57ToXYZ (fileE57) {
  const data = await fileE57.arrayBuffer()
  const dataArray = new Uint8Array(data)
  const webE57Lib = await webE57LibPromise
  return webE57Lib.convertE57(dataArray, 'XYZ')
  // return new Blob([convertedData])
}

const cleanupPointCloudViewer = (renderer) => {
  if (!renderer) return
  renderer.dispose()
}

const PointCloudViewer = props => {
  const pointCloudViewerRef = useRef(null)

  useEffect(() => {
    let camera, scene, renderer, points, controls

    // INFO - CH - 2025-04-07 - File adapted from:
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_xyz.html

    async function init () {
      if (!props.contentRawUrl) return

      try {
        camera = new THREE.PerspectiveCamera(
          45,
          pointCloudViewerRef.current.offsetWidth / pointCloudViewerRef.current.offsetHeight,
          0.1,
          100
        )
        camera.position.set(10, 7, 10)

        scene = new THREE.Scene()
        scene.add(camera)
        camera.lookAt(scene.position)

        const fileE57Promise = await fetch(props.contentRawUrl)

        if (fileE57Promise.status !== 200 && fileE57Promise.status !== 204) {
          cleanupPointCloudViewer(renderer)
          return
        }

        const fileXYZ = await convertE57ToXYZ(fileE57Promise)

        const loader = new XYZLoader()
        loader.loadFile(
          fileXYZ,
          function (geometry) {
            geometry.center()

            const vertexColors = geometry.hasAttribute('color') === true

            const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors })

            points = new THREE.Points(geometry, material)
            scene.add(points)
          }
        )

        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(
          pointCloudViewerRef.current.offsetWidth,
          pointCloudViewerRef.current.offsetHeight
        )

        const OrbitControlsLib = await OrbitControlsLibPromise
        controls = new OrbitControlsLib.OrbitControls(camera, renderer.domElement)

        renderer.setAnimationLoop(animate)
        controls.update()

        pointCloudViewerRef.current.appendChild(renderer.domElement)

        window.addEventListener('resize', onWindowResize)
      } catch (e) {
        console.error('Error in PointCloudViewer.jsx', e)
        cleanupPointCloudViewer(renderer)
      }
    }

    function onWindowResize () {
      if (pointCloudViewerRef.current === null) return

      camera.aspect = pointCloudViewerRef.current.offsetWidth / pointCloudViewerRef.current.offsetHeight
      camera.updateProjectionMatrix()

      renderer.setSize(
        pointCloudViewerRef.current.offsetWidth,
        pointCloudViewerRef.current.offsetHeight
      )
      controls.update()
      renderer.render(scene, camera)
    }

    function animate () {
      controls.update()
      renderer.render(scene, camera)
    }

    init()

    return () => {
      cleanupPointCloudViewer(renderer)
    }
  }, [props.contentRawUrl])

  return (
    <div ref={pointCloudViewerRef} className='PointCloudViewer' />
  )
}

export default PointCloudViewer

PointCloudViewer.propTypes = {
  contentRawUrl: PropTypes.string.isRequired
}
