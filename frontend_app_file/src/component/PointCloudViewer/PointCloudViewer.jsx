import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { convertE57 } from 'web-e57'
import * as THREE from 'three'
import { XYZLoader } from './XYZLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import FileTooHeavyWarning from '../FileTooHeavyWarning/FileTooHeavyWarning'

require('./PointCloudViewer.styl')

const RUN_VIEWER_MAX_FILE_SIZE_IN_OCTET = 1000000 // 1mo

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
  const pointCloudViewerRef = useRef(null)
  const [shouldRunViewer, setShouldRunViewer] = useState(false)

  useEffect(() => {
    setShouldRunViewer(props.contentSize <= RUN_VIEWER_MAX_FILE_SIZE_IN_OCTET)
  }, [props.contentSize])

  useEffect(() => {
    let camera, scene, renderer, points, controls

    // INFO - CH - 2025-04-07 - File adapted from:
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_xyz.html

    async function init () {
      if (!props.contentRawUrl) return
      if (shouldRunViewer === false) return

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

        controls = new OrbitControls(camera, renderer.domElement)

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
  }, [props.contentRawUrl, shouldRunViewer])

  return (
    shouldRunViewer
      ? <div ref={pointCloudViewerRef} className='PointCloudViewer' />
      : (
        <FileTooHeavyWarning
          contentSize={props.contentSize}
          onRunAnyway={() => setShouldRunViewer(true)}
        />
      )
  )
}

export default PointCloudViewer

PointCloudViewer.propTypes = {
  contentRawUrl: PropTypes.string.isRequired,
  contentSize: PropTypes.number.isRequired
}
