import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as WEBIFC from 'web-ifc'
import * as OBC from '@thatopen/components'

require('./IfcViewer.styl')

const IfcViewer = props => {
  const ifcViewerRef = useRef(null)

  useEffect(() => {
    if (!props.contentRawUrl) {
      ifcViewerRef.current = null
      return
    }

    // INFO - CH - 2025-02-26 - Documentation at
    // https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader

    const container = ifcViewerRef.current

    const components = new OBC.Components()

    const worlds = components.get(OBC.Worlds)

    const world = worlds.create()

    world.scene = new OBC.SimpleScene(components)
    world.renderer = new OBC.SimpleRenderer(components, container)
    world.camera = new OBC.SimpleCamera(components)

    components.init()

    // INFO - CH - 2025-02-26 - doc:
    // https://github.com/yomotsu/camera-controls?tab=readme-ov-file#setlookat-positionx-positiony-positionz-targetx-targety-targetz-enabletransition-
    world.camera.controls.setLookAt(
      12, 6, 8, // INFO - CH - 2025-02-26 - position x, y, z
      0, 0, -10, // INFO - CH - 2025-02-26 - target x, y, z
      true // // INFO - CH - 2025-02-26 - enableTransition
    )

    world.scene.setup()

    const grids = components.get(OBC.Grids)
    grids.create(world)
    world.scene.three.background = null

    async function loadIfc () {
      const file = await fetch(props.contentRawUrl)
      const data = await file.arrayBuffer()
      const buffer = new Uint8Array(data)

      const fragmentIfcLoader = components.get(OBC.IfcLoader)

      fragmentIfcLoader.settings.wasm = {
        // INFO - CH - 2025-02-26 - Source of wasm/ is from https://unpkg.com/web-ifc@0.0.68/
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
      world.scene.three.add(model)
    }

    loadIfc()

    world.renderer.onResize.add(world.camera.updateAspect)

    return () => {
      components.dispose()
      ifcViewerRef.current = null
    }
  }, [props.contentRawUrl])

  return (
    <div
      className='ifcViewer'
      ref={ifcViewerRef}
    />
  )
}

export default IfcViewer

IfcViewer.propTypes = {
  contentRawUrl: PropTypes.string.isRequired
}
