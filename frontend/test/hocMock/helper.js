export function restoreHistoryCallBack (callbacks) {
  callbacks.forEach(c => c.resetHistory())
}

export const isFunction = (functionToCheck) => {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
}
