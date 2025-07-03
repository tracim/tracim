import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import Agenda from './container/Agenda'

require('./css/index.styl')

const appInterface = {
  name: 'agenda',
  isRendered: false,
  renderAppFullscreen: (data: any): void => {
    document.getElementById(data.config.domContainer)!.classList.add('fullWidthFullHeight')

    ReactDOM.render(
      // HACK - CJ - 2025-07-03 - This works but gives an error and I don't know why
      // @ts-expect-error works
      <Router history={data.config.history}>
        {/* HACK - CJ - 2025-07-03 - Agenda was originally made in ts and its props are not declared */}
        {/* @ts-expect-error Agenda see above HACK comment */}
        <Agenda
          // @ts-expect-error Agenda see above HACK comment
          data={data}
        />
      </Router>,
      document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: (domId: string): boolean => {
    const element = document.getElementById(domId)!
    element.classList.remove('fullWidthFullHeight')

    return ReactDOM.unmountComponentAtNode(element)
  }
}

export default appInterface
