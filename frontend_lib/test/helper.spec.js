import { expect } from 'chai'
import {
  generateLocalStorageContentId,
  convertBackslashNToBr,
  handleFetchResult,
  hasSpaces,
  generateFetchResponse,
  parserStringToList,
  removeAtInUsername,
  FETCH_CONFIG,
  COMMON_REQUEST_HEADERS,
  setupCommonRequestHeaders,
  serialize,
  addRevisionFromTLM,
  wrapMentionsInSpanTags,
  checkUsernameValidity,
  MINIMUM_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  addMentionClassesOfUser
} from '../src/helper.js'

import {
  mockGetReservedUsernames200,
  mockGetUsernameAvailability200,
  mockGetReservedUsernames500,
  mockGetUsernameAvailability500
} from './apiMock.js'

import sinon from 'sinon'

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
      expect(FETCH_CONFIG.headers['X-Tracim-ClientToken']).to.be.a('string')
    })

    it('should store the client token in window session', () => {
      expect(window.sessionStorage.getItem('tracimClientToken')).to.eq(FETCH_CONFIG.headers['X-Tracim-ClientToken'])
    })
  })

  describe('setupCommonRequestHeaders() function', () => {
    it('should add COMMON_REQUEST_HEADERS object in xhr', () => {
      const xhr = new sinon.FakeXMLHttpRequest()
      xhr.open('GET', 'http://localhost')
      setupCommonRequestHeaders(xhr)
      expect(xhr.requestHeaders).to.deep.eq(COMMON_REQUEST_HEADERS)
    })
  })

  describe('the serialize(objectToSerialize, propertyMap) function', () => {
    const propertyMap = {
      user_id: 'userId',
      email: 'email',
      avatar_url: 'avatarUrl',
      public_name: 'publicName',
      lang: 'lang',
      username: 'username'
    }
    const objectToSerialize = {
      email: null,
      user_id: 0,
      public_name: '',
      lang: 'pt',
      username: undefined
    }
    const serializedObj = serialize(objectToSerialize, propertyMap)
    it('should return objectToSerialize serialized according to propertyMap', () => {
      expect(serializedObj).to.deep.equal({
        userId: objectToSerialize.user_id,
        email: objectToSerialize.email,
        publicName: objectToSerialize.public_name,
        lang: objectToSerialize.lang,
        username: objectToSerialize.username
      })
    })
  })

  describe('the addRevisionFromTLM function', () => {
    const author = {
      public_name: 'Foo',
      avatar_url: null,
      user_id: 1

    }
    const message = {
      author: author,
      content: {
        modified: '2020-05-23T12:00:01',
        current_revision_id: 2,
        current_revision_type: 'MODIFICATION'
      }
    }

    var timeline = [
      {
        author: author,
        commentList: [],
        comment_ids: [],
        created: 'One minute ago',
        created_raw: '2020-05-23T12:00:01',
        number: 1,
        revision_id: 1,
        revision_type: 'CREATION',
        timelineType: 'revision'
      },
      {
        author: author,
        commentList: [],
        comment_ids: [],
        created: 'One minute ago',
        created_raw: '2020-05-23T12:00:01',
        number: 0,
        revision_id: 1,
        revision_type: 'CREATION',
        timelineType: 'comment'
      }
    ]
    timeline = addRevisionFromTLM(message, timeline, 'en')
    const lastRevisionObject = timeline[timeline.length - 1]
    it('should add a new revision object to the end of the given list', () => {
      expect(lastRevisionObject.revision_id).to.be.equal(2)
    })
    it('should set a revision number to revision count + 1', () => {
      expect(lastRevisionObject.number).to.be.equal(2)
    })
  })

  describe('function wrapMentionsInSpanTags', () => {
    const DOMParser = new global.DOMParser()

    describe('with a source without any mention', () => {
      const textWithoutMention = 'This is a text without any mention'
      const result = wrapMentionsInSpanTags(textWithoutMention)

      it('should not modify the source', () => expect(textWithoutMention).to.equal(result))
    })

    describe('with only one mention in the source', () => {
      describe('with source as simple text', () => {
        describe('with the mention at the middle of a sentence', () => {
          const textWithMentionAtMiddle = 'This is a text with a mention @admin that should be wrapped'
          const result = wrapMentionsInSpanTags(textWithMentionAtMiddle)
          const parsedResult = DOMParser.parseFromString(result, 'text/html')
          const addedSpanList = parsedResult.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it('should have the span id starting with "mention-"', () => expect(addedSpanListId.startsWith('mention-')).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })

        describe('with the mention at the beginning of a sentence', () => {
          const textWithMentionAtBeginning = '@admin'
          const result = wrapMentionsInSpanTags(textWithMentionAtBeginning)
          const parsedResult = DOMParser.parseFromString(result, 'text/html')
          const addedSpanList = parsedResult.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it('should have the span id starting with "mention-"', () => expect(addedSpanListId.startsWith('mention-')).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })
      })

      describe('with source as HTML text', () => {
        describe('with the mention at the middle of a sentence', () => {
          const htmlTextWithMentionAtMiddle = '<div class="someClass">"This is a text with <p>a mention @admin that</p> should be wrapped"</div>'
          const result = wrapMentionsInSpanTags(htmlTextWithMentionAtMiddle)
          const parsedResult = DOMParser.parseFromString(result, 'text/html')
          const addedSpanList = parsedResult.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it('should have the span id starting with "mention-"', () => expect(addedSpanListId.startsWith('mention-')).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })

        describe('with the mention at the beginning of a sentence', () => {
          const htmlTextWithMentionAtBeginning = '<div class="someClass">@admin is a <p>mention</p> that should be wrapped"</div>'
          const result = wrapMentionsInSpanTags(htmlTextWithMentionAtBeginning)
          const parsedResult = DOMParser.parseFromString(result, 'text/html')
          const addedSpanList = parsedResult.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it('should have the span id starting with "mention-"', () => expect(addedSpanListId.startsWith('mention-')).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })
      })
    })

    describe('with 3 mention in the source', () => {
      describe('with source as simple text', () => {
        const textWithMultipleMentions = 'This is a text @user1 with 3 mention @admin that should be @user2 wrapped'
        const result = wrapMentionsInSpanTags(textWithMultipleMentions)
        const parsedResult = DOMParser.parseFromString(result, 'text/html')
        const addedSpanList = parsedResult.getElementsByTagName('span')

        it('should have 3 span tags', () => expect(addedSpanList).to.have.lengthOf(3))
        it('should contain the username in each span tag', () => {
          expect(addedSpanList[0].textContent).to.equal('@user1')
          expect(addedSpanList[1].textContent).to.equal('@admin')
          expect(addedSpanList[2].textContent).to.equal('@user2')
        })
        it('should have each span id starting with "mention-"', () => {
          expect(addedSpanList[0].id.startsWith('mention-')).to.equal(true)
          expect(addedSpanList[1].id.startsWith('mention-')).to.equal(true)
          expect(addedSpanList[2].id.startsWith('mention-')).to.equal(true)
        })
      })

      describe('with source as HTML text', () => {
        const htmlTextWithMention = '<div class="someClass">"This is @user1 a text with <p>a mention @admin that</p> should be @user2 wrapped"</div>'
        const result = wrapMentionsInSpanTags(htmlTextWithMention)
        const parsedResult = DOMParser.parseFromString(result, 'text/html')
        const addedSpanList = parsedResult.getElementsByTagName('span')

        it('should only have 3 span tags', () => expect(addedSpanList).to.have.lengthOf(3))
        it('should contain the username in the span tag', () => {
          expect(addedSpanList[0].textContent).to.equal('@user1')
          expect(addedSpanList[1].textContent).to.equal('@admin')
          expect(addedSpanList[2].textContent).to.equal('@user2')
        })
        it('should have each span id starting with "mention-"', () => {
          expect(addedSpanList[0].id.startsWith('mention-')).to.equal(true)
          expect(addedSpanList[1].id.startsWith('mention-')).to.equal(true)
          expect(addedSpanList[2].id.startsWith('mention-')).to.equal(true)
        })
      })
    })

    describe('with an @ in the source but without a space before', () => {
      const textWithAtWithoutPreSpace = 'This is a text with a mention@admin that should NOT be wrapped'
      const result = wrapMentionsInSpanTags(textWithAtWithoutPreSpace)
      const parsedResult = DOMParser.parseFromString(result, 'text/html')
      const addedSpanList = parsedResult.getElementsByTagName('span')

      it('should not have any span tag', () => {
        expect(addedSpanList).to.have.lengthOf(0)
      })
    })

    describe('if the source is NULL', () => {
      it('should throw an error exception', () => {
        try {
          wrapMentionsInSpanTags(null)
        } catch (e) {
          expect(e instanceof Error).should.equal(true)
        }
      })
    })
  })

  describe('the checkUsernameValidity function', () => {
    const mockProps = {
      t: m => m
    }
    const apiUrl = 'http://localhost/api'

    const nominalCases = [
      { username: 'foo', available: true, valid: true, message: '' },
      { username: 'foo ', available: true, valid: false, message: "Username can't contain any whitespace" },
      { username: 'foo(', available: true, valid: false, message: 'Allowed characters: {{allowedCharactersUsername}}' },
      { username: 'f'.repeat(MINIMUM_CHARACTERS_USERNAME - 1), available: true, valid: false, message: 'Username must be at least {{minimumCharactersUsername}} characters long' },
      { username: '', available: true, valid: false, message: 'Username must be at least {{minimumCharactersUsername}} characters long' },
      { username: 'o'.repeat(MAXIMUM_CHARACTERS_USERNAME + 1), available: true, valid: false, message: 'Username must be at maximum {{maximumCharactersUsername}} characters long' },
      { username: 'bar', available: false, valid: false, message: 'This username is not available' },
      { username: 'all', available: false, valid: false, message: 'This word is reserved for group mentions' }
    ]

    nominalCases.forEach(item => {
      const { username, available, valid, message } = item
      it(`should return ${valid} for '${username}'`, async () => {
        mockGetReservedUsernames200(apiUrl)
        mockGetUsernameAvailability200(apiUrl, username, available)
        const validity = await checkUsernameValidity(apiUrl, username, mockProps)
        expect(validity).to.deep.equal({ isUsernameValid: valid, usernameInvalidMsg: message })
      })
    })

    it('should throw Error if reserved usernames API code is not 200', async () => {
      const username = 'hello'
      mockGetReservedUsernames500(apiUrl)
      mockGetUsernameAvailability200(apiUrl, username, true)
      try {
        await checkUsernameValidity(apiUrl, username, mockProps)
      } catch (e) {
        expect(e).to.be.a('Error')
      }
    })

    it('should throw Error if username availability API code is not 200', async () => {
      const username = 'hello'
      mockGetReservedUsernames200(apiUrl)
      mockGetUsernameAvailability500(apiUrl, username, true)
      try {
        await checkUsernameValidity(apiUrl, username, mockProps)
      } catch (e) {
        expect(e).to.be.a('Error')
      }
    })
  })

  describe('the addMentionClassesOfUser function', () => {
    const mentionForFoo = '<span id="mention-foobar">@foo</span>'
    const htmlCommentWithoutMention = '<p>Hello <strong>world.</strong></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>'
    const htmlCommentWithMention = '<p>Hello <strong>world.</strong><span id="mention-foo">@foo</span></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>'
    const expectedHtmlCommentWithMention = '<p>Hello <strong>world.</strong><span id="mention-foo" class="mention-me">@foo</span></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>'
    const testCases = [
      {
        content: mentionForFoo,
        expectedContent: '<span id="mention-foobar" class="mention-me">@foo</span>',
        username: 'foo',
        description: 'nominal case'
      },
      {
        content: mentionForFoo,
        expectedContent: '<span id="mention-foobar">@foo</span>',
        username: 'bar',
        description: 'not mentioned user'
      },
      {
        content: '<span>plop</span>',
        expectedContent: '<span>plop</span>',
        username: 'foo',
        description: 'not a mention span'
      },
      {
        content: '<p>Hello world.</p>',
        expectedContent: '<p>Hello world.</p>',
        username: 'foo',
        description: 'simple comment without mention'
      },
      {
        content: htmlCommentWithoutMention,
        expectedContent: htmlCommentWithoutMention,
        username: 'foo',
        description: 'html comment without mention'
      },
      {
        content: htmlCommentWithMention,
        expectedContent: expectedHtmlCommentWithMention,
        username: 'foo',
        description: 'html comment with mention'
      }
    ]
    testCases.forEach(testCase => {
      const { content, expectedContent, username, description } = testCase
      const expectedResult = content === expectedContent ? 'not add class' : 'add class'
      it(`should ${expectedResult} (${description})`, () => {
        const modifiedContent = addMentionClassesOfUser(content, username)
        expect(modifiedContent).to.equal(expectedContent)
      })
    })
  })
})
