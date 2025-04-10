import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { loadE57, loadObj, loadXYZ } from './ThreeDFormatLoader.js'
const OrbitControlsLibPromise = import('three/examples/jsm/controls/OrbitControls.js')

require('./ThreeDViewer.styl')

const cleanupThreeDViewer = (renderer) => {
  if (!renderer) return
  renderer.dispose()
}

export const ThreeDViewer = props => {
  const objViewerRef = useRef(null)

  useEffect(() => {
    let camera, scene, renderer, controls
    let object

    async function init () {
      if (!props.contentRawUrl) return

      try {
        camera = new THREE.PerspectiveCamera(
          45,
          objViewerRef.current.offsetWidth / objViewerRef.current.offsetHeight,
          0.1,
          100
        )
        camera.position.set(10, 7, 10)

        scene = new THREE.Scene()

        scene.add(camera)
        camera.lookAt(scene.position)

        switch (props.contentExtension) {
          case 'obj':
            loadObj(props.contentRawUrl, scene, camera, object, render)
            break
          case 'e57':
            loadE57(props.contentRawUrl, scene, camera, object, render)
            break
          case 'xyz':
            loadXYZ(props.contentRawUrl, scene, camera, object, render)
            break
        }

        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(
          objViewerRef.current.offsetWidth,
          objViewerRef.current.offsetHeight
        )
        objViewerRef.current.appendChild(renderer.domElement)

        const OrbitControlsLib = await OrbitControlsLibPromise
        controls = new OrbitControlsLib.OrbitControls(camera, renderer.domElement)

        renderer.setAnimationLoop(animate)
        controls.update()

        window.addEventListener('resize', onWindowResize)
      } catch (e) {
        console.error('Error in ThreeDViewer.jsx', e)
        cleanupThreeDViewer(renderer)
      }
    }

    function onWindowResize () {
      if (objViewerRef.current === null) return

      camera.aspect = objViewerRef.current.offsetWidth / objViewerRef.current.offsetHeight
      camera.updateProjectionMatrix()

      renderer.setSize(
        objViewerRef.current.offsetWidth,
        objViewerRef.current.offsetHeight
      )
      controls.update()
      renderer.render(scene, camera)
    }

    function animate () {
      controls.update()
      renderer.render(scene, camera)
    }

    function render () {
      renderer.render(scene, camera)
    }

    init()

    return () => {
      cleanupThreeDViewer(renderer)
    }
  }, [props.contentRawUrl])

  return (
    <div ref={objViewerRef} className='ThreeDViewer' />
  )
}

export default ThreeDViewer
