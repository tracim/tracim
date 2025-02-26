import React, { useEffect, useRef } from 'react'

// import * as THREE from 'three'
import * as WEBIFC from 'web-ifc'
// import * as BUI from '@thatopen/ui'
// import Stats from 'stats.js'
import * as OBC from '@thatopen/components'

require('./IfcViewer.styl')

const IfcViewer = props => {
  const ifcViewerDom = useRef(null)

  useEffect(() => {
    // INFO - CH - 2025-02-26 - Documentation at
    // https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader

    // const container = document.getElementById('IfcViewerNew')
    const container = ifcViewerDom.current

    const components = new OBC.Components()

    const worlds = components.get(OBC.Worlds)

    const world = worlds.create()

    world.scene = new OBC.SimpleScene(components)
    world.renderer = new OBC.SimpleRenderer(components, container)
    world.camera = new OBC.SimpleCamera(components)

    components.init()

    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10)

    world.scene.setup()

    const grids = components.get(OBC.Grids)
    grids.create(world)
    world.scene.three.background = null

    async function loadIfc () {
      const file = await fetch(props.contentRawUrl)
      const data = await file.arrayBuffer()
      const buffer = new Uint8Array(data)

      // const fragments = components.get(OBC.FragmentsManager)
      const fragmentIfcLoader = components.get(OBC.IfcLoader)

      // await fragmentIfcLoader.setup()
      fragmentIfcLoader.settings.wasm = {
        // path: 'https://unpkg.com/web-ifc@0.0.68/',
        path: '/assets/wasm/',
        absolute: true
      }
      const excludedCats = [
        WEBIFC.IFCTENDONANCHOR,
        WEBIFC.IFCREINFORCINGBAR,
        WEBIFC.IFCREINFORCINGELEMENT
      ]

      for (const cat of excludedCats) {
        fragmentIfcLoader.settings.excludedCategories.add(cat)
      }
      fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true

      const model = await fragmentIfcLoader.load(buffer)
      // model.name = 'example'
      world.scene.three.add(model)
    }

    loadIfc()
  }, [])

  return (
    <div
      className='ifcViewer'
      ref={ifcViewerDom}
    />
  )
}

export default IfcViewer
