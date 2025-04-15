import * as THREE from 'three'

function fitCameraToBox (object, scene, cameraControls) {
  let group
  if (object.isObject3D) group = object
  else if (object.scene) group = object.scene
  else {
    console.log('Error in fitCameraToBox, object is not a valid 3D object')
    return
  }

  cameraControls.fitToBox(group, true)
}

export const loadOBJ = async (contentRawUrl, scene, cameraControls) => {
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
  const loader = new OBJLoader()
  loader.load(
    contentRawUrl,
    function (object) {
      scene.add(object)

      fitCameraToBox(object, scene, cameraControls)
    }
  )
}

export const loadE57 = async (contentRawUrl, scene, cameraControls) => {
  async function convertE57ToXYZ (fileE57) {
    const data = await fileE57.arrayBuffer()
    const dataArray = new Uint8Array(data)
    const webE57Lib = await import('web-e57')
    return webE57Lib.convertE57(dataArray, 'XYZ')
  }

  const fileE57Promise = await fetch(contentRawUrl)
  const fileXYZ = await convertE57ToXYZ(fileE57Promise)

  const { XYZLoader } = await import('./XYZLoader.js')
  const loader = new XYZLoader()
  loader.loadFile(
    fileXYZ,
    function (geometry) {
      geometry.center()

      const vertexColors = geometry.hasAttribute('color') === true

      const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors })

      const points = new THREE.Points(geometry, material)
      scene.add(points)

      fitCameraToBox(geometry, scene, cameraControls)
    }
  )
}

export const loadXYZ = async (contentRawUrl, scene, cameraControls) => {
  const { XYZLoader } = await import('./XYZLoader.js')
  const loader = new XYZLoader()
  loader.loadUrl(
    contentRawUrl,
    function (geometry) {
      geometry.center()

      const vertexColors = geometry.hasAttribute('color') === true

      const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: vertexColors })

      const points = new THREE.Points(geometry, material)
      scene.add(points)

      fitCameraToBox(geometry, scene, cameraControls)
    }
  )
}

export const load3DS = async (contentRawUrl, scene, cameraControls) => {
  const { TDSLoader } = await import('three/addons/loaders/TDSLoader.js')
  const loader = new TDSLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
    fitCameraToBox(object, scene, cameraControls)
  })
}

export const loadSTL = async (contentRawUrl, scene, cameraControls) => {
  const { STLLoader } = await import('three/addons/loaders/STLLoader.js')
  const loader = new STLLoader()

  const material = new THREE.MeshPhongMaterial(
    { color: 0xd5d5d5, specular: 0x494949, shininess: 200 }
  )

  loader.load(contentRawUrl, function (geometry) {
    let meshMaterial = material

    if (geometry.hasColors) {
      meshMaterial = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true })
    }

    const mesh = new THREE.Mesh(geometry, meshMaterial)

    mesh.rotation.set(-Math.PI / 2, 0, 0)

    mesh.castShadow = true
    mesh.receiveShadow = true

    scene.add(mesh)

    fitCameraToBox(mesh, scene, cameraControls)
  }, function (progress) {
    console.log((progress.loaded / progress.total * 100) + '%')
  })
}

export const loadDAE = async (contentRawUrl, scene, cameraControls) => {
  let contentObject
  const loadingManager = new THREE.LoadingManager(function () {
    scene.add(contentObject)
  })

  const { ColladaLoader } = await import('three/addons/loaders/ColladaLoader.js')
  const loader = new ColladaLoader(loadingManager)
  loader.load(contentRawUrl, function (collada) {
    contentObject = collada.scene
    fitCameraToBox(collada, scene, cameraControls)
  })
}

export const loadGCODE = async (contentRawUrl, scene, cameraControls) => {
  const { GCodeLoader } = await import('three/addons/loaders/GCodeLoader.js')
  const loader = new GCodeLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
    fitCameraToBox(object, scene, cameraControls)
  })
}

export const loadSVG = async (contentRawUrl, scene, cameraControls) => {
  const guiData = {
    currentURL: contentRawUrl,
    drawFillShapes: true,
    drawStrokes: true,
    fillShapesWireframe: false,
    strokesWireframe: false
  }

  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js')
  const loader = new SVGLoader()
  loader.load(guiData.currentURL, function (data) {
    const group = new THREE.Group()
    group.scale.multiplyScalar(0.25)
    group.position.x = -70
    group.position.y = 70
    group.scale.y *= -1

    let renderOrder = 0

    for (const path of data.paths) {
      const fillColor = path.userData.style.fill

      if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(fillColor),
          opacity: path.userData.style.fillOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: guiData.fillShapesWireframe
        })

        const shapes = SVGLoader.createShapes(path)

        for (const shape of shapes) {
          const geometry = new THREE.ShapeGeometry(shape)
          const mesh = new THREE.Mesh(geometry, material)
          mesh.renderOrder = renderOrder++

          group.add(mesh)
        }
      }

      const strokeColor = path.userData.style.stroke

      if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(strokeColor),
          opacity: path.userData.style.strokeOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: guiData.strokesWireframe
        })

        for (const subPath of path.subPaths) {
          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style)

          if (geometry) {
            const mesh = new THREE.Mesh(geometry, material)
            mesh.renderOrder = renderOrder++

            group.add(mesh)
          }
        }
      }
    }

    scene.add(group)

    fitCameraToBox(group, scene, cameraControls)
  })
}

export const loadTTF = async (contentRawUrl, scene, cameraControls) => {
  const text = 'Pack my box with five dozen liquor jugs.'

  const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })

  const group = new THREE.Group()
  group.position.z = -200

  scene.add(group)

  const { TTFLoader } = await import('three/addons/loaders/TTFLoader.js')
  const { Font } = await import('three/addons/loaders/FontLoader.js')
  const { TextGeometry } = await import('three/addons/geometries/TextGeometry.js')
  const loader = new TTFLoader()
  loader.load(contentRawUrl, function (json) {
    const font = new Font(json)

    const textGeo = new TextGeometry(text, {
      font: font,
      size: 24,
      depth: 10,
      curveSegments: 4,
      bevelThickness: 2,
      bevelSize: 1.5,
      bevelEnabled: true
    })
    textGeo.computeBoundingBox()
    textGeo.computeVertexNormals()

    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)

    const textMesh1 = new THREE.Mesh(textGeo, material)

    textMesh1.position.x = centerOffset
    textMesh1.position.y = 0
    textMesh1.position.z = 100

    textMesh1.rotation.x = 0
    textMesh1.rotation.y = Math.PI / 6

    group.add(textMesh1)

    fitCameraToBox(textMesh1, scene, cameraControls)
  })
}

export const loadWRL = async (contentRawUrl, scene, cameraControls) => {
  const { VRMLLoader } = await import('three/addons/loaders/VRMLLoader.js')
  const loader = new VRMLLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
    // fitCameraToBox(object, scene, cameraControls)
  })
}

export const loadVTK = async (contentRawUrl, scene, cameraControls) => {
  const { VTKLoader } = await import('three/addons/loaders/VTKLoader.js')
  const loader = new VTKLoader()
  loader.load(contentRawUrl, function (geometry) {
    geometry.center()
    geometry.computeVertexNormals()

    const material = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const mesh = new THREE.Mesh(geometry, material)

    scene.add(mesh)

    fitCameraToBox(mesh, scene, cameraControls)
  })
}
