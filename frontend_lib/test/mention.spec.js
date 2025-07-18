import { expect } from 'chai'
import React from 'react'
import {
  MENTION_ID_PREFIX,
  MENTION_ME_CLASS,
  addClassToMentionsOfUser,
  getInvalidMentionList,
  searchMentionAndReplaceWithTag,
  searchMention,
  sanitizeIframe
} from '../src/mentionOrLinkOrSanitize.js'

const invalidMentionsList = ['@invalid_mention', '@not_a_member']

describe('mentions on mentionOrLinkOrSanitize.js', () => {
  describe('regex mention', () => {
    const possibleTests = [
      {
        content: '<p>Hello @foo</p>',
        expected: [' @foo'],
        description: 'Single mention'
      },
      {
        content: '<p>Hello @foo and @bar</p>',
        expected: [' @foo', ' @bar'],
        description: 'Multiple mentions'
      },
      {
        content: '<p>Hello @foo, how are you?</p>',
        expected: [' @foo'],
        description: 'Single mention with text before and after'
      },
      {
        content: '<p>Hello @foo_bar, how are you?</p>',
        expected: [' @foo_bar'],
        description: 'Single mention with underscores'
      },
      {
        content: '<p>Hello @1foobar, how are you?</p>',
        expected: [' @1foobar'],
        description: 'Single mention with numbers'
      },
      {
        content: '<p>Hello @FOOBAR, how are you?</p>',
        expected: [' @FOOBAR'],
        description: 'Single mention with uppercase letters'
      },
      {
        content: '<p>Hello@foo, how are you?</p>',
        expected: [],
        description: 'Mention without leading whitespace'
      },
      {
        content: '<p>Hello @foo!</p>',
        expected: [' @foo'],
        description: 'Mention followed by punctuation'
      },
      {
        content: '<p>Hello,@foo</p>',
        expected: [',@foo'],
        description: 'Mention with punctuation before'
      },
      {
        content: '<p>Hello @foo_bar-baz, how are you?</p>',
        expected: [' @foo_bar-baz'],
        description: 'Single mention with underscores and hyphens'
      },
      {
        content: '<p>Hello @foo_bar baz, how are you?</p>',
        expected: [' @foo_bar'],
        description: 'Single mention with underscore before whitespace'
      }
    ]
    possibleTests.forEach(test => {
      const { content, expected, description } = test
      const result = searchMention(content)
      const expectedResult = `have ${expected.length} results`
      describe(`For: ${description}`, () => {
        it(`should ${expectedResult}`, () => {
          expect(result).to.deep.equal(expected)
        })
      })
    })
  })

  describe('function searchMentionAndReplaceWithTag', () => {
    const userList = [
      {
        username: 'foo',
        id: 1
      },
      {
        username: 'bar',
        id: 2
      }
    ]
    const possibleTests = [
      {
        content: '<p>Hello @foo</p>',
        expected: {
          html: '<p>Hello <html-mention userid="1"></html-mention></p>',
          invalidMentionList: []
        },
        description: 'Single mention'
      },
      {
        content: '<p>Hello @foo and @bar</p>',
        expected: {
          html: '<p>Hello <html-mention userid="1"></html-mention> and <html-mention userid="2"></html-mention></p>',
          invalidMentionList: []
        },
        description: 'Multiple mentions'
      },
      {
        content: '<p>Hello @all!</p>',
        expected: {
          html: '<p>Hello <html-mention roleid="0"></html-mention>!</p>',
          invalidMentionList: []
        },
        description: 'Mention of a role'
      },
      {
        content: '<p>Hello @all and @foo</p>',
        expected: {
          html: '<p>Hello <html-mention roleid="0"></html-mention> and <html-mention userid="1"></html-mention></p>',
          invalidMentionList: []
        },
        description: 'Mention of a role and a user'
      }
    ]
    possibleTests.forEach(test => {
      const { content, expected, description } = test
      const result = searchMentionAndReplaceWithTag(userList, content)
      const expectedResult = `have ${expected}`
      describe(`For: ${description}`, () => {
        it(`should ${expectedResult}`, () => {
          expect(result).to.deep.equal(expected)
        })
      })
    })
  })

  describe('the addClassToMentionsOfUser() and removeClassFromMentionsOfUser() functions', () => {
    const mentionForFoo = `<span id="${MENTION_ID_PREFIX}foobar">@foo</span>`
    const mentionForAll = `<span id="${MENTION_ID_PREFIX}foobar">@all</span>`
    const htmlCommentWithoutMention = '<p>Hello <strong>world.</strong></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>'
    const htmlCommentWithMention = `<p>Hello <strong>world.</strong><span id="${MENTION_ID_PREFIX}foo">@foo</span></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>`
    const expectedHtmlCommentWithMention = `<p>Hello <strong>world.</strong><span id="${MENTION_ID_PREFIX}foo" class="${MENTION_ME_CLASS}">@foo</span></p> <p><span style="background-color: #ffff00;">Yop</span></p> <ul> <li>Plop</li> </ul>`
    const testCases = [
      {
        content: mentionForFoo,
        expectedContent: `<span id="${MENTION_ID_PREFIX}foobar" class="${MENTION_ME_CLASS}">@foo</span>`,
        username: 'foo',
        description: 'single mention for user'
      },
      {
        content: mentionForAll,
        expectedContent: `<span id="${MENTION_ID_PREFIX}foobar" class="${MENTION_ME_CLASS}">@all</span>`,
        username: 'foo',
        description: 'single mention for all'
      },
      {
        content: mentionForFoo,
        expectedContent: `<span id="${MENTION_ID_PREFIX}foobar">@foo</span>`,
        username: 'bar',
        description: 'user who is not mentioned'
      },
      {
        content: mentionForFoo,
        expectedContent: `<span id="${MENTION_ID_PREFIX}foobar">@foo</span>`,
        username: 'fo',
        description: 'user who is not mentioned, bis'
      },
      {
        content: '<span>plop</span>',
        expectedContent: '<span>plop</span>',
        username: 'foo',
        description: 'span which is not a mention'
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
    describe('addClassToMentionsOfUser()', () => {
      testCases.forEach(testCase => {
        const { content, expectedContent, username, description } = testCase
        const expectedAddResult = content === expectedContent ? 'not change class' : 'add class'
        const modifiedContent = addClassToMentionsOfUser(content, username)
        describe(`for a ${description}`, () => {
          it(`should ${expectedAddResult}`, () => {
            expect(modifiedContent).to.equal(expectedContent)
          })
        })
      })
    })
  })

  describe('getInvalidMentionList()', () => {
    it('should return the invalid mentions in content', () => {
      const knownMentions = ['@user1', '@user2']
      const content = '<p>This is a content with two @user1 @user1 mentions and a @invalid_mention also two @not_a_member @not_a_member mentions, and also group mentions @all @tous @todos </p>'
      expect(getInvalidMentionList(content, knownMentions)).to.deep.equal(invalidMentionsList)
    })
  })
})

describe('function sanitizeIframe', () => {
  const defaultAllowedDomains = ['youtube.com', 'google.com']

  describe('Parameter htmlContent', () => {
    it('should return undefined when given undefind', () => {
      const result = sanitizeIframe(undefined, defaultAllowedDomains)
      expect(result).to.equal(undefined)
    })

    it('should return null when given null', () => {
      const result = sanitizeIframe(null, defaultAllowedDomains)
      expect(result).to.equal(null)
    })

    it('should return the boolean when given a boolean', () => {
      expect(sanitizeIframe(true, defaultAllowedDomains)).to.equal(true)
      expect(sanitizeIframe(false, defaultAllowedDomains)).to.equal(false)
    })

    it('should return the number when given a number', () => {
      expect(sanitizeIframe(42, defaultAllowedDomains)).to.equal(42)
      expect(sanitizeIframe(0, defaultAllowedDomains)).to.equal(0)
      expect(sanitizeIframe(-1, defaultAllowedDomains)).to.equal(-1)
    })

    it('should return the string when given a string without HTML', () => {
      const result = sanitizeIframe('Simple text content', defaultAllowedDomains)
      expect(result).to.equal('Simple text content')
    })

    it('should return the string when given a string with HTML but no iframes', () => {
      const content = '<div><p>Text</p><span>More text</span></div>'
      const result = sanitizeIframe(content, defaultAllowedDomains)
      expect(result).to.equal(content)
    })

    it('should return React element when given', () => {
      const element = React.createElement('div', null, 'content')
      const result = sanitizeIframe(element, defaultAllowedDomains)
      expect(result).to.equal(element)
    })

    it('should return React fragment when given', () => {
      const fragment = React.createElement(React.Fragment, null, 'content')
      const result = sanitizeIframe(fragment, defaultAllowedDomains)
      expect(result).to.equal(fragment)
    })

    it('should return array when given an array', () => {
      const arrayChild = ['text', 123, '<div key="1">content</div>']
      const result = sanitizeIframe(arrayChild, defaultAllowedDomains)
      expect(result).to.equal(arrayChild)
    })

    it('should return function child', () => {
      const funcChild = () => <div>content</div>
      const result = sanitizeIframe(funcChild, defaultAllowedDomains)
      expect(result).to.equal(funcChild)
    })

    it('should return React class component child', () => {
      class TestComponent extends React.Component {
        render () {
          return <div>content</div>
        }
      }
      const component = <TestComponent />
      const result = sanitizeIframe(component, defaultAllowedDomains)
      expect(result).to.equal(component)
    })

    it('should return functional component child', () => {
      const FuncComponent = () => <div>content</div>
      const component = <FuncComponent />
      const result = sanitizeIframe(component, defaultAllowedDomains)
      expect(result).to.equal(component)
    })

    it('should handle child with nested iframes in string', () => {
      const content = `
        <div>
          <p>Text before</p>
          <iframe src="https://youtube.com/embed/video123"></iframe>
          <p>Text between</p>
          <iframe src="https://untrusted-domain.com/video"></iframe>
          <p>Text after</p>
        </div>
      `
      const result = sanitizeIframe(content, defaultAllowedDomains)
      expect(result).to.include('<iframe src="https://youtube.com/embed/video123">')
      expect(result).to.include('<iframe src="https://untrusted-domain.com/video" sandbox="">')
      expect(result).to.include('<p>Text before</p>')
      expect(result).to.include('<p>Text between</p>')
      expect(result).to.include('<p>Text after</p>')
    })

    it('should return empty string child', () => {
      const result = sanitizeIframe('', defaultAllowedDomains)
      expect(result).to.equal('')
    })

    it('should return whitespace only string child', () => {
      const result = sanitizeIframe('   \n\t  ', defaultAllowedDomains)
      expect(result).to.equal('   \n\t  ')
    })
  })

  it('should allow all iframes when allowedDomains includes "*"', () => {
    const htmlContent = '<iframe src="https://any-domain.com/video"></iframe>'
    const result = sanitizeIframe(htmlContent, ['*'])
    expect(result).to.equal(htmlContent)
  })

  it('should allow iframes from allowed domains', () => {
    const htmlContent = '<iframe src="https://youtube.com/embed/video123"></iframe>'
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('youtube.com')
    expect(result).to.not.include('sandbox')
  })

  it('should add sandbox attribute to iframes from non-allowed domains', () => {
    const htmlContent = '<iframe src="https://untrusted-domain.com/video"></iframe>'
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('untrusted-domain.com')
    expect(result).to.include('sandbox=""')
  })

  it('should add sandbox to iframes with invalid URLs', () => {
    const htmlContent = '<div><iframe src="invalid-url"></iframe><p>Some content</p></div>'
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('iframe')
    expect(result).to.include('sandbox=""')
    expect(result).to.include('<p>Some content</p>')
  })

  it('should handle multiple iframes correctly', () => {
    const htmlContent = `
      <div>
        <iframe src="https://youtube.com/embed/video123"></iframe>
        <iframe src="https://untrusted-domain.com/video"></iframe>
        <iframe src="invalid-url"></iframe>
        <iframe src="https://google.com/something"></iframe>
      </div>
    `
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('<iframe src="https://youtube.com/embed/video123"></iframe>')
    expect(result).to.include('<iframe src="https://google.com/something"></iframe>')
    expect(result).to.include('<iframe src="https://untrusted-domain.com/video" sandbox=""></iframe>')
    expect(result).to.include('<iframe src="invalid-url" sandbox=""></iframe>')
  })

  it('should preserve non-iframe HTML content', () => {
    const htmlContent = `
      <div class="container">
        <h1>Title</h1>
        <p>Some text</p>
        <iframe src="https://youtube.com/embed/video123"></iframe>
        <span>More content</span>
      </div>
    `
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('<h1>Title</h1>')
    expect(result).to.include('<p>Some text</p>')
    expect(result).to.include('<span>More content</span>')
    expect(result).to.include('youtube.com')
  })

  it('should sanitize relative URLs in iframe src', () => {
    const htmlContent = `
      <div>
        <iframe src="/relative/path/video"></iframe>
      </div>
    `
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('iframe')
    expect(result).to.include('/relative/path/video')
    expect(result).to.include('sandbox=""')
  })

  it('should sanitize iframe src with javascript: in URL', () => {
    const htmlContent = '<iframe src="javascript:alert(1)"></iframe>'
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.include('iframe')
    expect(result).to.include('sandbox=""')
  })

  it('should allow HTML node input', () => {
    const div = document.createElement('div')
    div.innerHTML = '<iframe src="https://youtube.com/embed/video123"></iframe>'
    const result = sanitizeIframe(div, defaultAllowedDomains)
    expect(result.innerHTML).to.include('youtube.com')
    expect(result.innerHTML).to.not.include('sandbox')
  })

  it('should sanitize HTML node input with non-allowed domain', () => {
    const div = document.createElement('div')
    div.innerHTML = '<iframe src="https://untrusted-domain.com/video"></iframe>'
    const result = sanitizeIframe(div, defaultAllowedDomains)
    expect(result).to.not.equal(div)
    expect(result.innerHTML).to.include('untrusted-domain.com')
    expect(result.innerHTML).to.include('sandbox=""')
  })

  it('should allow JSX component input', () => {
    const JsxComponent = () => (
      <div>
        <iframe src='https://untrusted-domain.com/embed/video123' />
      </div>
    )
    const component = <JsxComponent />
    const result = sanitizeIframe(component, defaultAllowedDomains)
    expect(result).to.equal(component)
  })

  it('should allow empty string input', () => {
    const result = sanitizeIframe('', defaultAllowedDomains)
    expect(result).to.equal('')
  })

  it('should allow string without iframes', () => {
    const htmlContent = '<div><p>Just some text</p></div>'
    const result = sanitizeIframe(htmlContent, defaultAllowedDomains)
    expect(result).to.equal(htmlContent)
  })
})
