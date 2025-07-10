import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import Agenda from './container/Agenda'

require('./css/index.styl')

const appInterface = {
  name: 'agenda',
  isRendered: false,
  renderAppFullscreen: (data: any): void => {
    document.getElementById(data.config.domContainer)?.classList.add('fullWidthFullHeight')

    ReactDOM.render(
      <Router history={data.config.history}>
        <Agenda
          // HACK - CJ - 2025-07-03 - Agenda was originally made in js and its props are not declared
          // @ts-expect-error Agenda see above HACK comment
          data={data}
        />
      </Router>,
      document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: (domId: string): boolean => {
    const element = document.getElementById(domId)
    if (element === null) return false
    element.classList.remove('fullWidthFullHeight')

    return ReactDOM.unmountComponentAtNode(element)
  }
}

export default appInterface
