import { login, logout, create_thread, delete_thread  } from '../helpers/index.js'

describe('operation :: workspace > delete > thread', function () {
    before(function () {
        login (cy)
    })
    after(function() {
        logout (cy)
    })
    it ('all content > delete thread', function(){
        create_thread (cy)
        delete_thread (cy)
    })
})