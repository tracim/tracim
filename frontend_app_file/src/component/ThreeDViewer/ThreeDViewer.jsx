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
    let clock, camera, scene, renderer, cameraControls

    async function init () {
      const CameraControls = await import('camera-controls')
      CameraControls.default.install({ THREE: THREE })

      if (!props.contentRawUrl) return

      clock = new THREE.Clock()

      try {
        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(
          45,
          objViewerRef.current.offsetWidth / objViewerRef.current.offsetHeight,
          0.1,
          1000
        )
        renderer = new THREE.WebGLRenderer({ antialias: true })

        const ambientLight = new THREE.AmbientLight(0xffffff)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight.position.set(2, 2, 2)

        window.cameraDebug = camera
        camera.position.set(0, 0, 5)

        scene.add(camera)
        scene.add(ambientLight)
        scene.add(hemiLight)
        scene.add(dirLight)

        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(
          objViewerRef.current.offsetWidth,
          objViewerRef.current.offsetHeight
        )
        objViewerRef.current.appendChild(renderer.domElement)
        renderer.setAnimationLoop(animate)

        // eslint-disable-next-line new-cap
        cameraControls = new CameraControls.default(camera, renderer.domElement)

        switch (props.contentExtension) {
          case 'obj':
            loadOBJ(props.contentRawUrl, scene, cameraControls)
            break
          case 'e57':
            loadE57(props.contentRawUrl, scene, cameraControls)
            break
          case 'xyz':
            loadXYZ(props.contentRawUrl, scene, cameraControls)
            break
          case '3ds':
          // case 'max':
            load3DS(props.contentRawUrl, scene, cameraControls)
            break
          case 'stl':
            loadSTL(props.contentRawUrl, scene, cameraControls)
            break
          case 'dae':
            loadDAE(props.contentRawUrl, scene, cameraControls)
            break
          case 'gcode':
            loadGCODE(props.contentRawUrl, scene, cameraControls)
            break
          case 'svg':
            loadSVG(props.contentRawUrl, scene, cameraControls)
            break
          case 'ttf':
            loadTTF(props.contentRawUrl, scene, cameraControls)
            break
          case 'wrl':
            loadWRL(props.contentRawUrl, scene, cameraControls)
            break
          case 'vtk':
            loadVTK(props.contentRawUrl, scene, cameraControls)
            break
        }

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
      render()
    }

    function animate () {
      const delta = clock.getDelta()
      cameraControls.update(delta)
      render()
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
