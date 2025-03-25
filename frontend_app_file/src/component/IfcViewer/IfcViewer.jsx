import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as WEBIFC from 'web-ifc'
import * as OBC from '@thatopen/components'

require('./IfcViewer.styl')

// INFO - CH - 2025-03-17 - Cleanup is important because the viewer declares an infinite loop to redraw the
// ifc viewer every browser's animation frame.
// Also, it is important to not try to load a malformed ifc file or another format to the ifc viewer.
// It makes the browser tab to consume huge amount of memory until the browser kills the js process.
const cleanupIfcViewer = (components) => {
  components.dispose()
}

const IfcViewer = props => {
  const ifcViewerRef = useRef(null)

  useEffect(() => {
    if (!props.contentRawUrl) return

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
      try {
        const file = await fetch(props.contentRawUrl)

        if (file.status !== 200 && file.status !== 204) {
          cleanupIfcViewer(components)
          return
        }

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
      } catch (e) {
        console.error('Error during loading of file .ifc', e)
        cleanupIfcViewer(components)
      }
    }

    loadIfc()

    world.renderer.onResize.add(world.camera.updateAspect)

    return () => {
      cleanupIfcViewer(components)
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
