import { PAGES } from '../../support/urls_commands'

const fakeLink = 'https://awesomearticle.invalid/littletest.html'
const fakePreview = {
  "image": "/assets/branding/images/tracim-logo.png",
  "title": "The Holy Tests",
  "description": "I was writing a Cypress test and a Voice came to tell me something."
}
const exampleText = 'This is an example'

const publicationInput = '#wysiwygTimelineCommentPublication'
const publishButton = '.publications__publishArea__buttons__submit'

describe('Publications', () => {
  describe('publish a text', () => {
    beforeEach(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      cy.fixture('baseWorkspace').as('workspace').then((workspace) => {
        cy.visitPage({
          pageName: PAGES.PUBLICATION,
          params: { workspaceId: workspace.workspace_id },
          waitForTlm: true,
          options: {
            onBeforeLoad (win) {
              // RJ - 2021-04-20 - FIXME
              // use cy.intercept() when we migrate to Cypress 6 to intercept fetch calls
              // See https://github.com/tracim/tracim/issues/2872#issuecomment-823245093

              const originalFetch = win.fetch.bind(win)

              win.fetch = (resource, init) => {
                if (resource.includes('/api/url-preview?') && resource.includes('url=' + encodeURIComponent(fakeLink))) {
                  return new Promise(
                    (resolve) => resolve(
                      new Response(
                        JSON.stringify(fakePreview),
                        { status: 200 }
                      )
                    )
                  )
                }

                return originalFetch(resource, init)
              }
            }
          }
        })
      })
    })

    afterEach(() => {
      cy.cancelXHR()
    })

    it('should show the first message as preview for simple edition', function () {
      cy.get(publicationInput).type(exampleText)
      cy.contains(publishButton, 'Publish').click()
      cy.contains('.comment__body__content__textAndPreview', exampleText).should('be.visible')
    })

    it('should show the first message as preview for advanced edition', function () {
      cy.get(publicationInput).type('!')
      cy.get('.publications__publishArea__buttons__left__advancedEdition').click()
      cy.waitForTinyMCELoaded().then(() => {
        cy.typeInTinyMCE(exampleText)
        cy.contains(publishButton, 'Publish').click()
        cy.contains('.comment__body__content__textAndPreview', exampleText).should('be.visible')
      })
    })

    it('should preview links', function () {
      cy.get(publicationInput).type(fakeLink)
      cy.contains(publishButton, 'Publish').click()
      cy.contains('.linkPreview__content__title', fakePreview.title)
      cy.contains('.linkPreview__content__description', fakePreview.description)
      cy.get(`.linkPreview__img[src="${fakePreview.image}"]`).should('be.visible')
    })
  })
})
