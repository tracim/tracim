import React from 'react'
import { connect } from 'react-redux'

import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { IFCLoader } from 'web-ifc-three/IFCLoader'

//Creates the Three.js scene
const scene = new Scene()

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
}

//Creates the camera (point of view of the user)
const aspect = size.width / size.height
const camera = new PerspectiveCamera(75, aspect)
camera.position.z = 15
camera.position.y = 13
camera.position.x = 8

//Creates the lights of the scene
const lightColor = 0xffffff

const ambientLight = new AmbientLight(lightColor, 0.5)
scene.add(ambientLight)

const directionalLight = new DirectionalLight(lightColor, 1)
directionalLight.position.set(0, 10, 0)
directionalLight.target.position.set(-5, 0, 0)
scene.add(directionalLight)
scene.add(directionalLight.target)

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById('ifc_anchor')
const renderer = new WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
})

renderer.setSize(size.width, size.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30)
scene.add(grid)

const axes = new AxesHelper()
axes.material.depthTest = false
axes.renderOrder = 1
scene.add(axes)

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas)
controls.enableDamping = true
controls.target.set(-2, 0, 0)

//Animation loop
const animate = () => {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()


const ifcLoader = new IFCLoader()
// INFO - CH - 2025-02-25 - bellow is relative to /assets/
// Probably because webpack declares /assets/ as PublicPath
ifcLoader.ifcManager.setWasmPath('ifc/wasm/')
const ifcFileResponse = await fetch('/assets/ifc/Infra-Bridge.ifc')
const ifcFile = await ifcFileResponse.blob()
const ifcURL = URL.createObjectURL(ifcFile)
ifcLoader.load(ifcURL, (ifcModel) => scene.add(ifcModel))

const IfcViewer = props => {
  return (
    <div>
      woot2
    </div>
  )
}

const mapStateToProps = state => ({})
export default connect(mapStateToProps)(IfcViewer)
