import { expect } from 'chai'
import {
  handleLinksBeforeSave,
  wrapLinksInATags
} from '../src/mentionOrLink.js'
import { content } from './fixture/content.js'
import { PAGE } from '../src/helper.js'

const link = `#${content.content_id}`
const link2 = `#${content.content_id + 1}`
const link3 = `#${content.content_id + 2}`

describe('links on mentionOrLink.js', () => {
  describe('wrapLinksInATags()', () => {
    const parser = new global.DOMParser()

    function getWrappedDocument (html) {
      const doc = parser.parseFromString(html, 'text/html')
      return wrapLinksInATags(doc.body, doc)
    }

    describe('with a source without any link', () => {
      const textWithoutLink = 'This is a text without any link'
      const docBody = getWrappedDocument(textWithoutLink)
      it('should not modify the source', () => expect(textWithoutLink).to.equal(docBody.innerHTML))
    })

    describe('with only one link in the source', () => {
      describe('with source as simple text', () => {
        describe('with the link at the middle of a sentence', () => {
          const docBody = getWrappedDocument(
            `This is a text with a link ${link} that should be wrapped`
          )
          const addedATag = docBody.getElementsByTagName('a')
          const addedATagHref = addedATag[0].href

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(link))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })

        describe('with the link at the beginning of a sentence', () => {
          const docBody = getWrappedDocument(link)
          const addedATag = docBody.getElementsByTagName('a')
          const addedATagHref = addedATag[0].href

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(link))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })
      })

      describe('with source as HTML text', () => {
        describe('with the link at the middle of a sentence', () => {
          const docBody = getWrappedDocument(
            `<div class="someClass">"This is a text with <p>a link ${link} that</p> should be wrapped"</div>`
          )
          const addedATag = docBody.getElementsByTagName('a')
          const addedATagHref = addedATag[0].href

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(link))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })

        describe('with the link at the beginning of a sentence', () => {
          const docBody = getWrappedDocument(
            `<div class="someClass">${link} is a <p>link</p> that should be wrapped"</div>'`
          )
          const addedATag = docBody.getElementsByTagName('a')
          const addedATagHref = addedATag[0].href

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(link))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })
      })
    })

    describe('with 3 links in the source', () => {
      describe('with source as simple text', () => {
        const docBody = getWrappedDocument(`This is a text ${link} with 3 link ${link} that should be ${link} wrapped`)
        const addedATag = docBody.getElementsByTagName('a')

        it('should have 3 a tags', () => expect(addedATag).to.have.lengthOf(3))
        it('should contain the content id in each a tag', () => {
          expect(addedATag[0].textContent).to.equal(link)
          expect(addedATag[1].textContent).to.equal(link)
          expect(addedATag[2].textContent).to.equal(link)
        })
        it('should have the href with content path in each a tag', () => {
          expect(addedATag[0].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[1].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[2].href).to.equal(PAGE.CONTENT(content.content_id))
        })
      })

      describe('with source as HTML text', () => {
        const docBody = getWrappedDocument(
          `<div class="someClass">"This is ${link} a text with <p>a link ${link2} that</p> should be ${link3} wrapped"</div>`
        )
        const addedATag = docBody.getElementsByTagName('a')

        it('should have 3 a tags', () => expect(addedATag).to.have.lengthOf(3))
        it('should contain the content id in each a tag', () => {
          expect(addedATag[0].textContent).to.equal(link)
          expect(addedATag[1].textContent).to.equal(link2)
          expect(addedATag[2].textContent).to.equal(link3)
        })
        it('should have the href with content path in each a tag', () => {
          expect(addedATag[0].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[1].href).to.equal(PAGE.CONTENT(content.content_id + 1))
          expect(addedATag[2].href).to.equal(PAGE.CONTENT(content.content_id + 2))
        })
      })
    })

    describe('with an # in the source but without a space before', () => {
      const docBody = getWrappedDocument(`This is a text with a link${link} that should NOT be wrapped`)
      const addedATag = docBody.getElementsByTagName('a')

      it('should not have any a tag', () => expect(addedATag).to.have.lengthOf(0))

      it('should handle a document containing only a link correctly', () => {
        expect(getWrappedDocument(link).querySelector('a')).to.be.an.instanceof(Element)
      })

      it('should not add text between links', () => {
        expect(getWrappedDocument(link).textContent).to.equal(link)
        expect(getWrappedDocument(`${link} ${link2} ${link3}`).textContent).to.equal(`${link} ${link2} ${link3}`)
      })
    })
  })

  describe('handleLinksBeforeSave()', () => {
    describe('if the source is null', () => {
      it('should throw an error exception', () => {
        try {
          handleLinksBeforeSave(null)
        } catch (e) {
          expect(e).to.be.a(Error)
        }
      })
    })
  })
})
