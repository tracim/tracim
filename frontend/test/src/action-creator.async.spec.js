import { expect } from 'chai'
import sinon from 'sinon'
import { user } from '../hocMock/redux/user/user'
import {
  putMyselfName
} from '../../src/action-creator.async.js'
import { FETCH_CONFIG } from '../../src/helper'

const nock = require('nock')

describe('action-creator.async', () => {
  const dispatch = () => {}

  describe('putMyselfName', () => {
    beforeEach(() => {
      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me')
        .reply(200, { json: () =>{}})
    })

    it('should', (done) => {
      const newName = 'randomNewName'
      putMyselfName(user, newName)(dispatch).then((result) => {
        // console.log(result)
      }).then(done, done)
    })

  })
})
