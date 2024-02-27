
// INFO - CH - 2021-12-21 - this function force add the target element passed to <Popover> reactstrap's
// component. Without it, <Popover> can't find it's target because of the virtual DOM
// see https://github.com/reactstrap/reactstrap/issues/738 for more informations
export const reactstrapPopoverHack = (document, elementId) => {
  const div = document.createElement('div')
  div.setAttribute('id', elementId)
  document.body.appendChild(div)
}
