import * as THREE from 'three'

export const loadOBJ = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
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

export const loadE57 = async (contentRawUrl, scene, camera, object, render, renderer) => {
  async function convertE57ToXYZ (fileE57) {
    const data = await fileE57.arrayBuffer()
    const dataArray = new Uint8Array(data)
    const { webE57Lib } = await import('web-e57')
    return webE57Lib.convertE57(dataArray, 'XYZ')
    // return new Blob([convertedData])
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
    }
  )
}

export const loadXYZ = async (contentRawUrl, scene, camera, object, render, renderer) => {
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
    }
  )
}

export const load3DS = async (contentRawUrl, scene, camera, object, render, renderer) => {
  scene.add(new THREE.AmbientLight(0xffffff, 3))

  const directionalLight = new THREE.DirectionalLight(0xffeedd, 3)
  directionalLight.position.set(0, 0, 2)
  scene.add(directionalLight)

  const { TDSLoader } = await import('three/addons/loaders/TDSLoader.js')
  const loader = new TDSLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
  })
}

export const loadSTL = async (contentRawUrl, scene, camera, object, render, renderer) => {
  camera.position.set(3, 0, 3)

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

    mesh.position.set(0.5, 0.2, 0)
    mesh.rotation.set(-Math.PI / 2, Math.PI / 2, 0)
    mesh.scale.set(0.3, 0.3, 0.3)

    mesh.castShadow = true
    mesh.receiveShadow = true

    scene.add(mesh)

    scene.add(new THREE.HemisphereLight(0x8d7c7c, 0x494966, 3))

    function addShadowedLight (x, y, z, color, intensity) {
      const directionalLight = new THREE.DirectionalLight(color, intensity)
      directionalLight.position.set(x, y, z)
      scene.add(directionalLight)

      directionalLight.castShadow = true

      const d = 1
      directionalLight.shadow.camera.left = -d
      directionalLight.shadow.camera.right = d
      directionalLight.shadow.camera.top = d
      directionalLight.shadow.camera.bottom = -d

      directionalLight.shadow.camera.near = 1
      directionalLight.shadow.camera.far = 4

      directionalLight.shadow.bias = -0.002
    }

    addShadowedLight(1, 1, 1, 0xffffff, 3.5)
    addShadowedLight(0.5, 1, -1, 0xffd500, 3)
  }, function (progress) {
    console.log((progress.loaded / progress.total * 100) + '%')
  })
}

export const loadDAE = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const ambientLight = new THREE.AmbientLight(0xffffff)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
  directionalLight.position.set(1, 1, 0).normalize()
  scene.add(directionalLight)

  let contentObject
  const loadingManager = new THREE.LoadingManager(function () {
    scene.add(contentObject)
  })

  const { ColladaLoader } = await import('three/addons/loaders/ColladaLoader.js')
  const loader = new ColladaLoader(loadingManager)
  loader.load(contentRawUrl, function (collada) {
    contentObject = collada.scene
  })
}

export const loadGCODE = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const { GCodeLoader } = await import('three/addons/loaders/GCodeLoader.js')
  const loader = new GCodeLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
  })
}

export const loadSVG = async (contentRawUrl, scene, camera, object, render, renderer) => {
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

    render()
  })
}

export const loadTTF = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const text = 'Pack my box with five dozen liquor jugs.'

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4)
  dirLight1.position.set(0, 0, 1).normalize()
  scene.add(dirLight1)

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 2)
  dirLight2.position.set(0, 30, 10).normalize()
  dirLight2.color.setHSL(1, 1, 1, THREE.SRGBColorSpace)
  scene.add(dirLight2)

  const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })

  const group = new THREE.Group()
  group.position.z = -200

  scene.add(group)

  camera.position.set(
    55.151758762830354,
    3.666478115524944,
    165.25115988577946
  )

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
  })
}

export const loadWRL = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
  dirLight.position.set(200, 200, 200)
  scene.add(dirLight)

  const { VRMLLoader } = await import('three/addons/loaders/VRMLLoader.js')
  const loader = new VRMLLoader()
  loader.load(contentRawUrl, function (object) {
    scene.add(object)
  })
}

export const loadVTK = async (contentRawUrl, scene, camera, object, render, renderer) => {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
  dirLight.position.set(2, 2, 2)
  scene.add(dirLight)

  const { VTKLoader } = await import('three/addons/loaders/VTKLoader.js')
  const loader = new VTKLoader()
  loader.load(contentRawUrl, function (geometry) {
    geometry.center()
    geometry.computeVertexNormals()

    const material = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const mesh = new THREE.Mesh(geometry, material)
    camera.position.set(
      -0.40988523694571666,
      0.026503807967017012,
      0.5998131450652247
    )
    scene.add(mesh)
  })
}
