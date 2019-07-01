export class Context {
  constructor () {
    if (Context.instance) {
      return Context.instance
    }
    Context.instance = this
    this.apiKey = undefined
    this.workSpaceId = undefined
    return this
  }
  getApiKey () {
    return this.apiKey
  }
  setApiKey (apiKey) {
    this.apiKey = apiKey
  }
  getWorkSpaceId () {
    return this.workSpaceId
  }
  setWorkSpaceId (workSpaceId) {
    this.workSpaceId = workSpaceId
  }
}

export default Context
