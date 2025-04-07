import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { convertE57 } from 'web-e57'
import * as THREE from 'three'
import { XYZLoader } from './XYZLoader.js'

require('./PointCloudViewer.styl')

async function convertE57ToXYZ (fileE57) {
  const data = await fileE57.arrayBuffer()
  const dataArray = new Uint8Array(data)
  return convertE57(dataArray, 'XYZ')
  // return new Blob([convertedData])
}

const cleanupPointCloudViewer = (renderer) => {
  if (!renderer) return
  renderer.dispose()
}

const PointCloudViewer = props => {
  // INFO - CH - 2025-04-07 - Wrapper ref is used to get the width and height of the scene after first rendering
  const pointCloudViewerWrapperRef = useRef(null)
  const pointCloudViewerRef = useRef(null)

  useEffect(() => {
    let camera, scene, renderer, clock, points

    // INFO - CH - 2025-04-07 - File adapted from:
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_xyz.html

    async function init () {
      if (!props.contentRawUrl) return

      try {
        camera = new THREE.PerspectiveCamera(
          45,
          pointCloudViewerWrapperRef.current.offsetWidth / pointCloudViewerWrapperRef.current.offsetHeight,
          0.1,
          100
        )
        camera.position.set(10, 7, 10)

        scene = new THREE.Scene()
        scene.add(camera)
        camera.lookAt(scene.position)

        clock = new THREE.Clock()

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
          pointCloudViewerWrapperRef.current.offsetWidth,
          pointCloudViewerWrapperRef.current.offsetHeight
        )

        renderer.setAnimationLoop(animate)

        pointCloudViewerRef.current.appendChild(renderer.domElement)

        window.addEventListener('resize', onWindowResize)
      } catch (e) {
        console.error('Error in PointCloudViewer.jsx', e)
        cleanupPointCloudViewer(renderer)
      }
    }

    function onWindowResize () {
      camera.aspect = pointCloudViewerWrapperRef.current.offsetWidth / pointCloudViewerWrapperRef.current.offsetHeight
      camera.updateProjectionMatrix()

      renderer.setSize(
        pointCloudViewerWrapperRef.current.offsetWidth,
        pointCloudViewerWrapperRef.current.offsetHeight
      )
    }

    function animate () {
      const delta = clock.getDelta()

      if (points) {
        points.rotation.x += delta * 0.2
        points.rotation.y += delta * 0.5
      }

      renderer.render(scene, camera)
    }

    init()

    return () => {
      cleanupPointCloudViewer(renderer)
    }
  }, [props.contentRawUrl])

  return (
    <div ref={pointCloudViewerWrapperRef} className='PointCloudViewer'>
      <div ref={pointCloudViewerRef} />
    </div>
  )
}

export default PointCloudViewer

PointCloudViewer.propTypes = {
  contentRawUrl: PropTypes.string.isRequired
}
