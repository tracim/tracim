import { expect } from 'chai'
import {
  generateLocalStorageContentId,
  convertBackslashNToBr,
  handleFetchResult,
  hasNotAllowedCharacters,
  hasSpaces,
  generateFetchResponse,
  parserStringToList,
  removeAtInUsername,
  FETCH_CONFIG
} from '../src/helper.js'

describe('helper.js', () => {
  describe('generateLocalStorageContentId()', () => {
    it('should return the proper string', () => {
      const fixture = {
        workspaceId: 23,
        contentId: 53,
        contentType: 'randomContentType',
        dataType: 'randomContentType'
      }
      const localStorageContentId = generateLocalStorageContentId(
        fixture.workspaceId,
        fixture.contentId,
        fixture.contentType,
        fixture.dataType
      )
      expect(localStorageContentId).to.eql(`${fixture.workspaceId}/${fixture.contentId}/${fixture.contentType}_${fixture.dataType}`)
    })
  })

  describe('convertBackslashNToBr()', () => {
    it('should return the proper msg', () => {
      const msg = 'random\nMessage'
      const expectedMsg = 'random<br />Message'
      const returnedMsg = convertBackslashNToBr(msg)
      expect(returnedMsg).to.equal(expectedMsg)
    })
  })

  describe('handleFetchResult()', () => {
    it('should return the proper Response when status: 200\'', (done) => {
      const cloneFetchResult = {
        json: () => 'jsonTest'
      }
      const fetchResult = Promise.resolve({
        ok: true,
        status: 200,
        clone: () => ({ json: () => 'jsonTest' })
      })
      fetchResult.then((response) => {
        handleFetchResult(response).then((result) => {
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json() })
        }).then(done, done)
      })
    })

    it('should return the proper Response when status: 300', (done) => {
      const cloneFetchResult = {
        json: () => 'jsonTest'
      }
      const fetchResult = Promise.resolve({
        ok: true,
        status: 300,
        clone: () => ({ json: () => 'jsonTest' })
      })
      fetchResult.then((response) => {
        handleFetchResult(response).then((result) => {
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json() })
        }).then(done, done)
      })
    })
  })

  describe('generateFetchResponse()', () => {
    it('should return the proper Response when status: 200', (done) => {
      const cloneFetchResult = {
        json: () => 'jsonTest'
      }
      const fetchResult = Promise.resolve({
        ok: true,
        status: 200,
        clone: () => ({ json: () => 'jsonTest' })
      })
      fetchResult.then((response) => {
        generateFetchResponse(response).then((result) => {
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json() })
        }).then(done, done)
      })
    })
  })

  describe('parserStringToList(string, separatorList)', () => {
    it('should return a list of substrings within string that were separated by separatorList separators', () => {
      const string = 'randomEmail@randomEmail.randomEmail,randomEmail@randomEmail.randomEmail;randomEmail@randomEmail.randomEmail'
      const separatorList = [',', ';']

      const substringList = ['randomEmail@randomEmail.randomEmail', 'randomEmail@randomEmail.randomEmail', 'randomEmail@randomEmail.randomEmail']

      expect(substringList).to.deep.equal(parserStringToList(string, separatorList))
    })
  })

  describe('the removeAtInUsername() function', () => {
    it('should return the username without @ when username is "@johndoe"', () => {
      expect(removeAtInUsername('@johndoe')).to.eq('johndoe')
    })
    it('should return the username without @  and whitespace when username is "    @johndoe    "', () => {
      expect(removeAtInUsername('    @johndoe    ')).to.eq('johndoe')
    })
    it('should return the username without channges when username is "johndoe"', () => {
      expect(removeAtInUsername('johndoe')).to.eq('johndoe')
    })
    it('should return the username empty when username is "@"', () => {
      expect(removeAtInUsername('@')).to.eq('')
    })
    it('should return the username without @ when username is "@j"', () => {
      expect(removeAtInUsername('@j')).to.eq('j')
    })
    it('should return the username empty when username is empty', () => {
      expect(removeAtInUsername('')).to.eq('')
    })
  })

  describe('the hasNotAllowedCharacters() function', () => {
    it('should return false if name has only allowed characters', () => {
      expect(hasNotAllowedCharacters('g00dUsername')).to.eq(false)
    })
    it('should return true if name has not allowed characters', () => {
      expect(hasNotAllowedCharacters('b@dU$ername')).to.eq(true)
    })
  })

  describe('the hasSpaces() function', () => {
    it('should return false if name has no spaces', () => {
      expect(hasSpaces('g00dUsername')).to.eq(false)
    })
    it('should return true if name has spaces', () => {
      expect(hasSpaces('bad Username')).to.eq(true)
    })
  })

  describe('FETCH_CONFIG object', () => {
    it('should include tracim client token header', () => {
      expect('X-Tracim-ClientToken' in FETCH_CONFIG.headers).to.eq(true)
      expect(typeof FETCH_CONFIG.headers['X-Tracim-ClientToken']).to.eq('string')
    })

    it('should store the client token in window session', () => {
      expect(window.sessionStorage.getItem('tracimClientToken')).to.eq(FETCH_CONFIG.headers['X-Tracim-ClientToken'])
    })

  })
})
