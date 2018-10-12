import { login, logout, create_htmldocument, delete_htmldocument } from '../helpers/index.js'

describe('operation :: workspace > delete > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        logout (cy)
    })
    it ('all content > delete html-doc', function(){
        create_htmldocument (cy)
        delete_htmldocument (cy)
    })
})