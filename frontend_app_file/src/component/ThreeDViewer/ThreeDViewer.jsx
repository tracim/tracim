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

const CameraControls = await import('camera-controls')
CameraControls.default.install({ THREE: THREE })

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
      if (!props.contentRawUrl) return

      clock = new THREE.Clock()

      try {
        camera = new THREE.PerspectiveCamera(
          45,
          objViewerRef.current.offsetWidth / objViewerRef.current.offsetHeight,
          0.1,
          1000
        )
        window.cameraDebug = camera
        camera.position.set(0, 0, 5)

        scene = new THREE.Scene()

        scene.add(camera)
        camera.lookAt(scene.position)

        const ambientLight = new THREE.AmbientLight(0xffffff)
        scene.add(ambientLight)

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3)
        scene.add(hemiLight)

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight.position.set(2, 2, 2)
        scene.add(dirLight)

        renderer = new THREE.WebGLRenderer({ antialias: true })

        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(
          objViewerRef.current.offsetWidth,
          objViewerRef.current.offsetHeight
        )
        objViewerRef.current.appendChild(renderer.domElement)

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

        renderer.setAnimationLoop(animate)
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
