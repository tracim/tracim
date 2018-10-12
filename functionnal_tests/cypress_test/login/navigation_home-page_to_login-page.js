import { login, logout } from '../helpers/index.js'

describe('login :: navigate > disconnect', function () {
    it('login and logout', function () {
        login (cy)
        logout (cy)
    })
})