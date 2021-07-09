import { expect } from 'chai'
import {
  handleLinksBeforeSave,
  wrapLinksInATags
} from '../src/mentionOrLink.js'
import { content } from './fixture/content.js'
import { PAGE } from '../src/helper.js'
import { mockGetContentWithoutWorkspaceId200 } from './apiMock.js'

const link = `#${content.content_id}`
const link2 = `#${content.content_id + 1}`
const link3 = `#${content.content_id + 2}`
const apiUrl = 'http://fake.url/api'

describe('links on mentionOrLink.js', () => {
  describe('wrapLinksInATags()', () => {
    const parser = new global.DOMParser()

    async function getWrappedDocument (html) {
      const doc = parser.parseFromString(html, 'text/html')
      return wrapLinksInATags(doc.body, doc, apiUrl)
    }

    describe('with a source without any link', () => {
      let docBody
      const textWithoutLink = 'This is a text without any link'
      before(async () => {
        docBody = await getWrappedDocument(textWithoutLink)
      })
      it('should not modify the source', () => expect(textWithoutLink).to.equal(docBody.innerHTML))
    })

    describe('with only one link in the source', () => {
      describe('with source as simple text', () => {
        describe('with the link at the middle of a sentence', () => {
          let docBody
          let addedATag
          let addedATagHref

          before(async () => {
            mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
            docBody = await getWrappedDocument(
              `This is a text with a link ${link} that should be wrapped`
            )
            addedATag = docBody.getElementsByTagName('a')
            addedATagHref = addedATag[0].href
          })

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(content.label))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })

        describe('with the link at the beginning of a sentence', () => {
          let docBody
          let addedATag
          let addedATagHref

          before(async () => {
            mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
            docBody = await getWrappedDocument(link)
            addedATag = docBody.getElementsByTagName('a')
            addedATagHref = addedATag[0].href
          })

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(content.label))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })
      })

      describe('with source as HTML text', () => {
        describe('with the link at the middle of a sentence', () => {
          let docBody
          let addedATag
          let addedATagHref

          before(async () => {
            mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
            docBody = await getWrappedDocument(
              `<div class="someClass">"This is a text with <p>a link ${link} that</p> should be wrapped"</div>`
            )
            addedATag = docBody.getElementsByTagName('a')
            addedATagHref = addedATag[0].href
          })

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(content.label))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })

        describe('with the link at the beginning of a sentence', () => {
          let docBody
          let addedATag
          let addedATagHref

          before(async () => {
            mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
            docBody = await getWrappedDocument(
              `<div class="someClass">${link} is a <p>link</p> that should be wrapped"</div>'`
            )
            addedATag = docBody.getElementsByTagName('a')
            addedATagHref = addedATag[0].href
          })

          it('should only have one a tag', () => expect(addedATag).to.have.lengthOf(1))
          it('should contain the content id in the a tag', () => expect(addedATag[0].textContent).to.equal(content.label))
          it('should have the href with content path', () => expect(addedATagHref).to.equal(PAGE.CONTENT(content.content_id)))
        })
      })
    })

    describe('with 3 links in the source', () => {
      describe('with source as simple text', () => {
        let docBody
        let addedATag

        before(async () => {
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
          docBody = await getWrappedDocument(`This is a text ${link} with 3 link ${link} that should be ${link} wrapped`)
          addedATag = docBody.getElementsByTagName('a')
        })

        it('should have 3 a tags', () => expect(addedATag).to.have.lengthOf(3))
        it('should contain the content id in each a tag', () => {
          expect(addedATag[0].textContent).to.equal(content.label)
          expect(addedATag[1].textContent).to.equal(content.label)
          expect(addedATag[2].textContent).to.equal(content.label)
        })
        it('should have the href with content path in each a tag', () => {
          expect(addedATag[0].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[1].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[2].href).to.equal(PAGE.CONTENT(content.content_id))
        })
      })

      describe('with source as HTML text', () => {
        let docBody
        let addedATag

        before(async () => {
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id + 1)
          mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id + 2)
          docBody = await getWrappedDocument(
            `<div class="someClass">"This is ${link} a text with <p>a link ${link2} that</p> should be ${link3} wrapped"</div>`
          )
          addedATag = docBody.getElementsByTagName('a')
        })

        it('should have 3 a tags', () => expect(addedATag).to.have.lengthOf(3))
        it('should contain the content id in each a tag', () => {
          expect(addedATag[0].textContent).to.equal(content.label)
          expect(addedATag[1].textContent).to.equal(content.label)
          expect(addedATag[2].textContent).to.equal(content.label)
        })
        it('should have the href with content path in each a tag', () => {
          expect(addedATag[0].href).to.equal(PAGE.CONTENT(content.content_id))
          expect(addedATag[1].href).to.equal(PAGE.CONTENT(content.content_id + 1))
          expect(addedATag[2].href).to.equal(PAGE.CONTENT(content.content_id + 2))
        })
      })
    })

    describe('with an # in the source but without a space before', () => {
      let docBodyNotTag
      let docBodyOneLink
      let docBodyNoText

      before(async () => {
        mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
        docBodyNotTag = await getWrappedDocument(`This is a text with a link${link} that should NOT be wrapped`)

        mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
        docBodyOneLink = await getWrappedDocument(link)

        mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id)
        mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id + 1)
        mockGetContentWithoutWorkspaceId200(apiUrl, content.content_id + 2)
        docBodyNoText = await getWrappedDocument(`${link} ${link2} ${link3}`)
      })

      it('should not have any a tag', () => {
        const addedATag = docBodyNotTag.getElementsByTagName('a')
        expect(addedATag).to.have.lengthOf(0)
      })

      it('should handle a document containing only a link correctly', async () => {
        expect(docBodyOneLink.querySelector('a')).to.be.an.instanceof(Element)
      })

      it('should not add text between links', async () => {
        expect(docBodyNoText.textContent).to.equal(`${content.label} ${content.label} ${content.label}`)
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
