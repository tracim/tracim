function GLOBAL_instanceSpecificEventReducer (event) {
  var type = event.detail.type

  switch (type) {
    case 'TRACIM_HEADER_MOUNTED':
      try {
        if (GLOBAL_instanceSpecificLibrary && GLOBAL_instanceSpecificLibrary.default && GLOBAL_instanceSpecificLibrary.default.headerBtn) {
          GLOBAL_instanceSpecificLibrary.default.headerBtn.render()
        }
      } catch (e) {

      }
      break
  }
}

document.addEventListener('appCustomEventListener', GLOBAL_instanceSpecificEventReducer)
