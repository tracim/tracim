import { expect } from 'chai'
import { user } from '../hocMock/redux/user/user'
import {
  putMyselfName
} from '../../src/action-creator.async.js'
import { FETCH_CONFIG } from '../../src/helper'
import { mockPutMyselfName200 } from '../apiMock'

const dispatch = () => {}

describe('action-creator.async', () => {
  describe('putMyselfName', () => {
    it('should call the right endpoint and return the right result', (done) => {
      const newName = 'randomNewName'
      mockPutMyselfName200(FETCH_CONFIG.apiUrl, newName, user.timezone, user.lang)
      putMyselfName(user, newName)(dispatch).then((result) => {
        expect(result.status).to.equal(200)
        expect(result.url).to.equal(`${FETCH_CONFIG.apiUrl}/users/me`)
      }).then(done, done)
    })
  })
})
