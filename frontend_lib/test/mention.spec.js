import { expect } from 'chai'
import {
  MENTION_ID_PREFIX,
  MENTION_ME_CLASS,
  addClassToMentionsOfUser,
  getInvalidMentionList,
  searchMentionAndReplaceWithTag,
  searchMention
} from '../src/mentionOrLink.js'

const invalidMentionsList = ['@invalid_mention', '@not_a_member']

describe('mentions on mentionOrLink.js', () => {
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
    const roleList = [
      {
        slug: 'all',
        id: 1
      }
    ]
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
          html: '<p>Hello <html-mention roleid="1"></html-mention>!</p>',
          invalidMentionList: []
        },
        description: 'Mention of a role'
      },
      {
        content: '<p>Hello @all and @foo</p>',
        expected: {
          html: '<p>Hello <html-mention roleid="1"></html-mention> and <html-mention userid="1"></html-mention></p>',
          invalidMentionList: []
        },
        description: 'Mention of a role and a user'
      }
    ]
    possibleTests.forEach(test => {
      const { content, expected, description } = test
      const result = searchMentionAndReplaceWithTag(roleList, userList, content)
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
