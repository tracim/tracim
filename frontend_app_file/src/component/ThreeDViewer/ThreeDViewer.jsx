import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import {
  load3DS,
  loadDAE,
  loadE57,
  loadGCODE,
  loadOBJ,
  loadSTL,
  loadSVG,
  loadTTF,
  loadVTK,
  loadWRL,
  loadXYZ
} from './ThreeDFormatLoader.js'

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
          1000
        )
        window.cameraDebug = camera
        camera.position.set(10, 7, 10)

        scene = new THREE.Scene()

        scene.add(camera)
        camera.lookAt(scene.position)

        switch (props.contentExtension) {
          case 'obj':
            loadOBJ(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'e57':
            loadE57(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'xyz':
            loadXYZ(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case '3ds':
          case 'max':
            load3DS(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'stl':
            loadSTL(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'dae':
            loadDAE(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'gcode':
            loadGCODE(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'svg':
            loadSVG(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'ttf':
            loadTTF(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'wrl':
            loadWRL(props.contentRawUrl, scene, camera, object, render, renderer)
            break
          case 'vtk':
            loadVTK(props.contentRawUrl, scene, camera, object, render, renderer)
            break
        }

        renderer = new THREE.WebGLRenderer({ antialias: true })

        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(
          objViewerRef.current.offsetWidth,
          objViewerRef.current.offsetHeight
        )
        objViewerRef.current.appendChild(renderer.domElement)

        const OrbitControlsLib = await import('three/examples/jsm/controls/OrbitControls.js')
        controls = new OrbitControlsLib.OrbitControls(camera, renderer.domElement)

        renderer.setAnimationLoop(animate)
        controls.update()
        render()

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
