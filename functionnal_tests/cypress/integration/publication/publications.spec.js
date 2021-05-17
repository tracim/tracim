import { PAGES } from '../../support/urls_commands'

const fakeLink = 'https://awesomearticle.invalid/littletest.html'
const fakePreview = {
  "image": "/assets/images/logo-tracim.png",
  "title": "The Holy Tests",
  "description": "I was writing a Cypress test and a Voice came to tell me something."
}

describe('Publications', () => {
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

  it('should preview links', function () {
    cy.get('#wysiwygTimelineCommentPublication').type(fakeLink)
    cy.get('button').contains('Publish').click()
    cy.get('.linkPreview__content__title').contains(fakePreview.title)
    cy.get('.linkPreview__content__description').contains(fakePreview.description)
    cy.get(`.linkPreview__img[src="${fakePreview.image}"]`).should('be.visible')
  })

  const text = 'Hello, world'
  it('A translation button should be visible', () => {
    cy.get('#wysiwygTimelineCommentPublication').type(text)
    cy.get('button').contains('Publish').click()
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', 'en')
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', text)
  })

  it('a menu should allow to change the target language', () => {
    cy.get('#wysiwygTimelineCommentPublication').type(text)
    cy.get('button').contains('Publish').click()
    cy.get('[data-cy=commentTranslateButton__languageMenu]').click()
    cy.get('[data-cy=commentTranslateButton__language__fr]').click()
    cy.get('[data-cy=commentTranslateButton]').click()
    cy.contains('.feedItem__publication', 'fr')
  })
})
