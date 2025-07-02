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
      // @ts-expect-error @types/react uses types from react 19 and not 16 as they require version *
      <Router history={data.config.history}>
        {/* @ts-expect-error Agenda was originally made in ts and its props are not declared */}
        <Agenda
          // @ts-expect-error Agenda was originally made in ts and its props are not declared
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
