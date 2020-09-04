import { expect } from 'chai'
import {
  wrapMentionsInSpanTags,
  addClassToMentionsOfUser,
  removeClassFromMentionsOfUser,
  handleMentionsBeforeSave,
  MENTION_ID_PREFIX,
  MENTION_ME_CLASS
} from '../src/mention.js'

describe('mention.js', () => {
  describe('function wrapMentionsInSpanTags', () => {
    const parser = new global.DOMParser()

    describe('with a source without any mention', () => {
      const textWithoutMention = 'This is a text without any mention'
      const document = parser.parseFromString(textWithoutMention, 'text/html')
      wrapMentionsInSpanTags(document)
      it('should not modify the source', () => expect(textWithoutMention).to.equal(document.body.innerHTML))
    })

    describe('with only one mention in the source', () => {
      describe('with source as simple text', () => {
        describe('with the mention at the middle of a sentence', () => {
          const textWithMentionAtMiddle = 'This is a text with a mention @admin that should be wrapped'
          const document = parser.parseFromString(textWithMentionAtMiddle, 'text/html')
          wrapMentionsInSpanTags(document)
          const addedSpanList = document.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it(`should have the span id starting with "${MENTION_ID_PREFIX}"`, () => expect(addedSpanListId.startsWith(MENTION_ID_PREFIX)).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })

        describe('with the mention at the beginning of a sentence', () => {
          const textWithMentionAtBeginning = '@admin'
          const document = parser.parseFromString(textWithMentionAtBeginning, 'text/html')
          wrapMentionsInSpanTags(document)
          const addedSpanList = document.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it(`should have the span id starting with "${MENTION_ID_PREFIX}"`, () => expect(addedSpanListId.startsWith(MENTION_ID_PREFIX)).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })
      })

      describe('with source as HTML text', () => {
        describe('with the mention at the middle of a sentence', () => {
          const htmlTextWithMentionAtMiddle = '<div class="someClass">"This is a text with <p>a mention @admin that</p> should be wrapped"</div>'
          const document = parser.parseFromString(htmlTextWithMentionAtMiddle, 'text/html')
          wrapMentionsInSpanTags(document)
          const addedSpanList = document.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it(`should have the span id starting with "${MENTION_ID_PREFIX}"`, () => expect(addedSpanListId.startsWith(MENTION_ID_PREFIX)).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })

        describe('with the mention at the beginning of a sentence', () => {
          const htmlTextWithMentionAtBeginning = '<div class="someClass">@admin is a <p>mention</p> that should be wrapped"</div>'
          const document = parser.parseFromString(htmlTextWithMentionAtBeginning, 'text/html')
          wrapMentionsInSpanTags(document)
          const addedSpanList = document.getElementsByTagName('span')
          const addedSpanListId = addedSpanList[0].id

          it('should only have one span tag', () => expect(addedSpanList).to.have.lengthOf(1))
          it('should contain the username in the span tag', () => expect(addedSpanList[0].textContent).to.equal('@admin'))
          it(`should have the span id starting with "${MENTION_ID_PREFIX}"`, () => expect(addedSpanListId.startsWith(MENTION_ID_PREFIX)).to.equal(true))
          it('should have the span id with a non-empty uuid', () => expect(
            addedSpanListId.substring(addedSpanListId.lastIndexOf('-') + 1)).to.not.equal('')
          )
        })
      })
    })

    describe('with 3 mentions in the source', () => {
      describe('with source as simple text', () => {
        const textWithMultipleMentions = 'This is a text @user1 with 3 mention @admin that should be @user2 wrapped'
        const document = parser.parseFromString(textWithMultipleMentions, 'text/html')
        wrapMentionsInSpanTags(document)
        const addedSpanList = document.getElementsByTagName('span')

        it('should have 3 span tags', () => expect(addedSpanList).to.have.lengthOf(3))
        it('should contain the username in each span tag', () => {
          expect(addedSpanList[0].textContent).to.equal('@user1')
          expect(addedSpanList[1].textContent).to.equal('@admin')
          expect(addedSpanList[2].textContent).to.equal('@user2')
        })
        it(`should have each span id starting with "${MENTION_ID_PREFIX}"`, () => {
          expect(addedSpanList[0].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
          expect(addedSpanList[1].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
          expect(addedSpanList[2].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
        })
      })

      describe('with source as HTML text', () => {
        const htmlTextWithMention = '<div class="someClass">"This is @user1 a text with <p>a mention @admin that</p> should be @user2 wrapped"</div>'
        const document = parser.parseFromString(htmlTextWithMention, 'text/html')
        wrapMentionsInSpanTags(document)
        const addedSpanList = document.getElementsByTagName('span')

        it('should only have 3 span tags', () => expect(addedSpanList).to.have.lengthOf(3))
        it('should contain the username in the span tag', () => {
          expect(addedSpanList[0].textContent).to.equal('@user1')
          expect(addedSpanList[1].textContent).to.equal('@admin')
          expect(addedSpanList[2].textContent).to.equal('@user2')
        })
        it(`should have each span id starting with "${MENTION_ID_PREFIX}"`, () => {
          expect(addedSpanList[0].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
          expect(addedSpanList[1].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
          expect(addedSpanList[2].id.startsWith(MENTION_ID_PREFIX)).to.equal(true)
        })
      })
    })

    describe('with an @ in the source but without a space before', () => {
      const textWithAtWithoutPreSpace = 'This is a text with a mention@admin that should NOT be wrapped'
      const document = parser.parseFromString(textWithAtWithoutPreSpace, 'text/html')
      wrapMentionsInSpanTags(document)
      const addedSpanList = document.getElementsByTagName('span')

      it('should not have any span tag', () => {
        expect(addedSpanList).to.have.lengthOf(0)
      })
    })
  })

  describe('the addClassToMentionsOfUser() and removeClassFromMentionsOfUser() functions', () => {
    const parser = new globalThis.DOMParser()
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
    describe('removeClassFromMentionsOfUser()', () => {
      testCases.forEach(testCase => {
        const { content, expectedContent, username, description } = testCase
        const expectedRemoveResult = content === expectedContent ? 'not change class' : 'remove class'
        const document = parser.parseFromString(expectedContent, 'text/html')
        removeClassFromMentionsOfUser(document, username)
        describe(`for a ${description}`, () => {
          it(`should ${expectedRemoveResult}`, () => {
            expect(document.body.innerHTML).to.equal(content)
          })
        })
      })
    })
  })

  describe('the handleMentionsBeforeSave() function', () => {
    describe('if the source is null', () => {
      it('should throw an error exception', () => {
        try {
          handleMentionsBeforeSave(null)
        } catch (e) {
          expect(e).to.be.a(Error)
        }
      })
    })
  })
})
