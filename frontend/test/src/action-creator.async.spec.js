import { expect } from 'chai'
import { user } from '../hocMock/redux/user/user'
import {
  putMyselfName
} from '../../src/action-creator.async.js'
import { FETCH_CONFIG } from '../../src/helper'

const nock = require('nock')
const dispatch = () => {}

describe('action-creator.async', () => {
  describe('putMyselfName', () => {
    beforeEach(() => {
      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me')
        .reply(200, { json: () => {} })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should call the right endpoint and return the right result', (done) => {
      const newName = 'randomNewName'
      putMyselfName(user, newName)(dispatch).then((result) => {
        expect(result.status).to.equal(200)
        expect(result.url).to.equal(`${FETCH_CONFIG.apiUrl}/users/me`)
      }).then(done, done)
    })
  })
})
