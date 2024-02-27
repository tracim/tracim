import { expect } from 'chai'
import {
  buildFilePreviewUrl,
  checkEmailValidity,
  createSpaceTree,
  formatAbsoluteDate,
  handleFetchResult,
  hasSpaces,
  generateFetchResponse,
  parserStringToList,
  removeAtInUsername,
  splitFilenameExtension,
  removeExtensionOfFilename,
  FETCH_CONFIG,
  COMMON_REQUEST_HEADERS,
  setupCommonRequestHeaders,
  serialize,
  addRevisionFromTLM,
  checkUsernameValidity,
  MINIMUM_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  permissiveNumberEqual,
  updateTLMUser,
  stringIncludes
} from '../src/helper.js'

import {
  mockGetReservedUsernames200,
  mockGetUsernameAvailability200,
  mockGetReservedUsernames500,
  mockGetUsernameAvailability500
} from './apiMock.js'

import sinon from 'sinon'

describe('helper.js', () => {
  describe('updateTLMUser()', () => {
    it('should return the author object added with is_from_system_admin if author is not null', () => {
      const author = { username: 'Author' }
      const returnedObject = updateTLMUser(author, true)
      expect(returnedObject).to.deep.equal({ ...author, is_from_system_admin: false })
    })

    it('should return the System Administrator author object if author is null', () => {
      const systemAdministratorAuthor = {
        allowed_space: 0,
        auth_type: 'internal',
        avatar_url: null,
        created: '',
        email: '',
        is_active: true,
        is_deleted: false,
        is_from_system_admin: true,
        lang: 'en',
        profile: 'administrators',
        public_name: 'System Administrator',
        timezone: '',
        user_id: 0,
        username: ''
      }
      const returnedObject = updateTLMUser(null, true)
      expect(returnedObject).to.deep.equal(systemAdministratorAuthor)
    })

    it('should return the user object added with is_from_system_admin if user is not null', () => {
      const user = { username: 'user' }
      const returnedObject = updateTLMUser(user)
      expect(returnedObject).to.deep.equal({ ...user, is_from_system_admin: false })
    })

    it('should return the Unknkown user object if user is null', () => {
      const unknownUser = {
        allowed_space: 0,
        auth_type: 'internal',
        avatar_url: null,
        created: '',
        email: '',
        is_active: true,
        is_deleted: false,
        is_from_system_admin: true,
        lang: 'en',
        profile: 'administrators',
        public_name: 'Unknown',
        timezone: '',
        user_id: 0,
        username: ''
      }
      const returnedObject = updateTLMUser(null)
      expect(returnedObject).to.deep.equal(unknownUser)
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
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json(), ok: response.ok })
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
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json(), ok: response.ok })
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
          expect(result).to.eql({ apiResponse: response, body: cloneFetchResult.json(), ok: response.ok })
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

  describe('the removeExtensionOfFilename and splitFilenameExtension', () => {
    const testCases = [
      ['withoutextension', 'withoutextension', ''],
      ['image.jpg', 'image', '.jpg'],
      ['image.hello.jpg', 'image.hello', '.jpg'],
      ['archive.tar.gz', 'archive', '.tar.gz'],
      ['archive.hello.tar.gz', 'archive.hello', '.tar.gz'],
      ['archive.tar.tar.gz', 'archive.tar', '.tar.gz']
    ]

    for (const [filename, basename, extension] of testCases) {
      it(`Correctly splits ${filename} into ${basename} and ${extension}`, () => {
        expect(removeExtensionOfFilename(filename)).to.equal(basename)
        expect(splitFilenameExtension(filename)).to.deep.equal({ basename, extension })
      })
    }
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
        current_revision_type: 'MODIFICATION',
        version_number: 42
      }
    }

    var timeline = [
      {
        author: author,
        commentList: [],
        created: 'One minute ago',
        created_raw: '2020-05-23T12:00:01',
        version_number: 1,
        revision_id: 1,
        revision_type: 'CREATION',
        timelineType: 'revision'
      },
      {
        author: author,
        commentList: [],
        created: 'One minute ago',
        created_raw: '2020-05-23T12:00:01',
        version_number: 0,
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
  })

  describe('the checkUsernameValidity function', () => {
    const mockProps = {
      t: m => m
    }
    const apiUrl = 'http://localhost/api'

    const nominalCases = [
      { username: 'foo', available: true, valid: true, message: '' },
      { username: 'foo ', available: true, valid: false, message: "Username can't contain any whitespace" },
      { username: '@foo', available: true, valid: false, message: 'Allowed characters: {{allowedCharactersUsername}}' },
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

  describe('formatAbsoluteDate', () => {
    it('Should return a french format date', () => {
      expect(formatAbsoluteDate(new Date(), 'fr')).to.be.equal = new Date().toLocaleString('fr')
    })

    it('Should return an english format date', () => {
      expect(formatAbsoluteDate(new Date(), 'en')).to.be.equal = new Date().toLocaleString('en')
    })

    it('Should return only time using options', () => {
      expect(
        formatAbsoluteDate(new Date(), 'en', 'p')
      ).to.be.equal = new Date().toLocaleString('en', { hour: '2-digit', minute: '2-digit' })
    })
  })

  describe('the permissiveNumberEqual function', () => {
    const testCases = [
      {
        var1: 0,
        var2: 1,
        expectedResult: false
      },
      {
        var1: 0,
        var2: 0,
        expectedResult: true
      },
      {
        var1: 12,
        var2: '12',
        expectedResult: true
      },
      {
        var1: 1,
        var2: '12',
        expectedResult: false
      },
      {
        var1: '12',
        var2: '12',
        expectedResult: true
      },
      {
        var1: 0,
        var2: null,
        expectedResult: true
      },
      {
        var1: 0,
        var2: undefined,
        expectedResult: true
      }
    ]
    for (const { var1, var2, expectedResult } of testCases) {
      const typeOfVar1 = typeof var1
      const typeOfVar2 = typeof var2
      const result = permissiveNumberEqual(var1, var2)
      it(`should compare "${var1}" (${typeOfVar1}) and "${var2}" (${typeOfVar2}) to "${expectedResult}"`, () => {
        expect(result).to.be.equal(expectedResult)
      })
    }
  })

  describe('createSpaceTree', () => {
    it('should return an empty array if spaceList is empty', () => {
      expect(createSpaceTree([])).to.be.deep.equal([])
    })

    it('should return a the same array if spaceList is an array with only one element that already has children', () => {
      const array = [{ children: [{ label: 'a' }, { label: 'b' }] }]
      expect(createSpaceTree(array)).to.be.deep.equal(array)
    })

    it('should return a the array added by a children prop if spaceList is an array with only one element', () => {
      expect(createSpaceTree([{ label: 'a' }])).to.be.deep.equal([{ label: 'a', children: [] }])
    })

    it('should return a array the respective arborescence given for spaceList', () => {
      const intialArray = [{ workspace_id: 1 }, { parent_id: 1 }]
      const finalArray = [{ workspace_id: 1, children: [{ parent_id: 1, children: [] }] }]
      expect(createSpaceTree(intialArray)).to.be.deep.equal(finalArray)
    })

    it('should return a array the respective arborescence given for spaceList even if the parent already has children', () => {
      const intialArray = [{ workspace_id: 1, children: [{ label: 'a' }] }, { parent_id: 1 }]
      const finalArray = [{ workspace_id: 1, children: [{ label: 'a' }, { parent_id: 1, children: [] }] }]
      expect(createSpaceTree(intialArray)).to.be.deep.equal(finalArray)
    })

    it('should return a array the respective arborescence given for spaceList even if its bigger than 2 levels', () => {
      const intialArray = [{ workspace_id: 1 }, { parent_id: 1, workspace_id: 2 }, { parent_id: 2, workspace_id: 3 }, { parent_id: 3 }]
      const finalArray = [
        {
          workspace_id: 1,
          children: [
            {
              parent_id: 1,
              workspace_id: 2,
              children: [
                {
                  parent_id: 2,
                  workspace_id: 3,
                  children: [
                    { parent_id: 3, children: [] }
                  ]
                }
              ]
            }
          ]
        }
      ]
      expect(createSpaceTree(intialArray)).to.be.deep.equal(finalArray)
    })

    it('should return a array the respective arborescence given for spaceList even if it has more than one child', () => {
      const intialArray = [{ workspace_id: 1 }, { parent_id: 1, workspace_id: 2 }, { parent_id: 1, workspace_id: 3 }, { parent_id: 3 }]
      const finalArray = [
        {
          workspace_id: 1,
          children: [
            { parent_id: 1, workspace_id: 2, children: [] },
            { parent_id: 1, workspace_id: 3, children: [{ parent_id: 3, children: [] }] }
          ]
        }
      ]
      expect(createSpaceTree(intialArray)).to.be.deep.equal(finalArray)
    })
  })

  describe('Function buildFilePreviewUrl', () => {
    it('should URL-encode the file name', () => {
      expect(
        buildFilePreviewUrl('http://unit.test/', 1, 2, 3, "Captures / d'écran (n°1)", 4, 640, 480)
      ).to.equal(
        "http://unit.test//workspaces/1/files/2/revisions/3/preview/jpg/640x480/Captures%20%2F%20d'%C3%A9cran%20(n%C2%B01).jpg?page=4"
      )
    })
  })

  describe('checkEmailValidity()', () => {
    it('should return true if the string has two not-empty parts with an @ between', () => {
      expect(checkEmailValidity('something@something')).to.equal(true)
    })

    it('should return false if the string has only the second part and an @', () => {
      expect(checkEmailValidity('@something')).to.equal(false)
    })

    it('should return false if the string has only the first part and an @', () => {
      expect(checkEmailValidity('something@')).to.equal(false)
    })

    it('should return false if the first part has a comma', () => {
      expect(checkEmailValidity('somet,hing@something')).to.equal(false)
    })

    it('should return false if the first part has a semicolon', () => {
      expect(checkEmailValidity('somet;hing@something')).to.equal(false)
    })

    it('should return false if the first part has a >', () => {
      expect(checkEmailValidity('somet>hing@something')).to.equal(false)
    })

    it('should return false if the first part has a <', () => {
      expect(checkEmailValidity('somet<hing@something')).to.equal(false)
    })

    it('should return false if the second part has a comma', () => {
      expect(checkEmailValidity('something@somet,hing')).to.equal(false)
    })

    it('should return false if the second part has a semicolon', () => {
      expect(checkEmailValidity('something@somet;hing')).to.equal(false)
    })

    it('should return false if the second part has a >', () => {
      expect(checkEmailValidity('something@somet>hing')).to.equal(false)
    })

    it('should return false if the second part has a <', () => {
      expect(checkEmailValidity('something@somet<hing')).to.equal(false)
    })

    it('should return false if the string has only an @', () => {
      expect(checkEmailValidity('@')).to.equal(false)
    })

    it('should return false if the string has no @', () => {
      expect(checkEmailValidity('something')).to.equal(false)
    })

    it('should return true if the string has two not-empty parts with an @ between even if multiples @', () => {
      expect(checkEmailValidity('something@something@something')).to.equal(true)
    })
  })

  describe('stringIncludes()', () => {
    const token = 'abc'
    const tests = [
      {
        title: 'should return false with an undefined string and token',
        expect: false
      },
      {
        title: 'should return false with an undefined string',
        token: token,
        expect: false
      },
      {
        title: 'should return false with an undefined token',
        value: 'hello there',
        expect: false
      },
      {
        title: 'should return false with an empty string and token',
        value: '',
        token: '',
        expect: false
      },
      {
        title: 'should return false with an empty token',
        value: 'general kenobi',
        token: '',
        expect: false
      },
      {
        title: 'should return false with an empty string',
        value: '',
        token: token,
        expect: false
      },
      {
        title: 'should return false with smaller string (1 char)',
        value: 'a',
        token: token,
        expect: false
      },
      {
        title: 'should return false with smaller string (2 char)',
        value: 'ab',
        token: token,
        expect: false
      },
      {
        title: 'should return true with an exact match (case matching)',
        value: 'abc',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (start) (case matching)',
        value: 'abcdefghijkl',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (middle) (case matching)',
        value: 'defgabchijkl',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (end) (case matching)',
        value: 'defghijklabc',
        token: token,
        expect: true
      },
      {
        title: 'should return true with token repeated in string (case matching)',
        value: 'deabcfghiabcjklabc',
        token: token,
        expect: true
      },
      {
        title: 'should return true with an exact match (case not matching)',
        value: 'Abc',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (start) (case not matching)',
        value: 'aBcdefghijkl',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (middle) (case not matching)',
        value: 'defgaBChijkl',
        token: token,
        expect: true
      },
      {
        title: 'should return true with a greater string (end) (case not matching)',
        value: 'defghijklAbC',
        token: token,
        expect: true
      },
      {
        title: 'should return true with token repeated in string (case not matching)',
        value: 'deAbcfghiaBcjklabc',
        token: token,
        expect: true
      },
      {
        title: 'should return false with token scattered in string',
        value: 'f38kqV89oxyPp%^h98F2a7kYinuyj!b@po1129xEst#UP3CZSp5N',
        token: token,
        expect: false
      },
      {
        title: 'should return true in string with special characters',
        value: 'f38kqV89oxyPp\0x% fðßghœþäöabcö«öó³¤€²³¤¹²ähgf»¬æææ¤̛‘’¥FGGØÖÅØ§÷áßþghœøïúhœö¶```ðßfgðëfühfþg’‘öóœþüïåþ²³äëþ²³¹ëä¤œø³²åóáøç¶öí¶óíó«úüïßðfë^h98 \tF2a7\nYinuyj!b@po1129x\tEst#UP3CZSp5N',
        token: token,
        expect: true
      },
      {
        title: 'should return true in string and token with special characters',
        value: 'f38kqV89oxyPp\0x% fðßghœþäöabcö«öó³¤€²³¤¹²ähgf»¬æææ¤̛‘’¥FGGØÖÅØ§÷áßþghœøïúhœö¶```ðßfgðëfühfþg’‘öóœþüïåþ²³äëþ²³¹ëä¤œø³²åóáøç¶öí¶óíó«úüïßðfë^h98 \tF2a7\nYinuyj!b@po1129x\tEst#UP3CZSp5N',
        token: '\0x% fðßghœþäöab',
        expect: true
      },
      {
        title: 'should return false in string with special characters when there is no match',
        value: 'f38kqV89oxyPp\0x% fðßghœþäöö«öó³¤€²³¤¹²ähgf»¬æææ¤̛‘’¥FGGØÖÅØ§÷áßþghœøïúhœö¶```ðßfgðëfühfþg’‘öóœþüïåþ²³äëþ²³¹ëä¤œø³²åóáøç¶öí¶óíó«úüïßðfë^h98 \tF2a7\nYinuyj!b@po1129x\tEst#UP3CZSp5N',
        token: token,
        expect: false
      },
      {
        title: 'should return false in string and token with special characters when there is no match',
        value: 'f38kqV89oxyPp\0x% fðßghœþäöabcö«öó³¤€²³¤¹²ähgf»¬æææ¤̛‘’¥FGGØÖÅØ§÷áßþghœøïúhœö¶```ðßfgðëfühfþg’‘öóœþüïåþ²³äëþ²³¹ëä¤œø³²åóáøç¶öí¶óíó«úüïßðfë^h98 \tF2a7\nYinuyj!b@po1129x\tEst#UP3CZSp5N',
        token: '\0x% fðßgœþäöab',
        expect: false
      }
    ]

    tests.forEach(test => {
      it(test.title, () => {
        expect(stringIncludes(test.token)(test.value)).to.equal(test.expect)
      })
    })
  })
})
