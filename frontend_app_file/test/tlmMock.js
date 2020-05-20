export const registerLiveMessageHandlerListMock = (callback) => (tlmList) => {
  const tlmHandlerList = {}
  tlmList.forEach(tlm => {
    if (!tlmHandlerList[tlm.entityType]) tlmHandlerList[tlm.entityType] = {}
    tlmHandlerList[tlm.entityType][tlm.coreEntityType] = tlm.handler
  })
  callback(tlmHandlerList)
}
