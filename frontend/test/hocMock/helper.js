import { shallow } from 'enzyme'

// INFO - CH - 2019-06-24 - shallowUntilTarget copied from https://github.com/airbnb/enzyme/issues/539#issuecomment-321638534

/*
 * Repeatedly render a component tree using enzyme.shallow() until
 * finding and rendering TargetComponent.
 *
 * The `componentInstance` parameter is a React component instance.
 * Example: <MyComponent {...props} />
 *
 * The `TargetComponent` parameter is the React class (or function) that
 * you want to retrieve from the component tree.
 */
export function shallowUntilTarget(componentInstance, TargetComponent, {
  maxTries = 10,
  shallowOptions,
  _shallow = shallow,
} = {}) {
  if (!componentInstance) {
    throw new Error('componentInstance parameter is required')
  }
  if (!TargetComponent) {
    throw new Error('TargetComponent parameter is required')
  }

  let root = _shallow(componentInstance, shallowOptions)

  if (typeof root.type() === 'string') {
    // If type() is a string then it's a DOM Node.
    // If it were wrapped, it would be a React component.
    throw new Error(
      'Cannot unwrap this component because it is not wrapped')
  }

  for (let tries = 1; tries <= maxTries; tries++) {
    if (root.is(TargetComponent)) {
      // Now that we found the target component, render it.
      return root.shallow(shallowOptions)
    }
    // Unwrap the next component in the hierarchy.
    root = root.dive()
  }

  throw new Error(`Could not find ${TargetComponent} in rendered instance: ${componentInstance}; gave up after ${maxTries} tries`)
}
