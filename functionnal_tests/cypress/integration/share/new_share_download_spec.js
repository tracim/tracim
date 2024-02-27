
import { PAGES } from '../../support/urls_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const emailInput = '.shareDownload__email__input'
const email1 = 'email1@email1.email1'
const email2 = 'email2@email2.email2'
const email3 = 'email1@email3.email3'

let workspaceId
let contentId

describe('New share download form', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(newContent => {
          contentId = newContent.content_id
        })
    }).then(promise => {
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: { contentId }
      })
      cy.get('[data-cy=popin_right_part_share]').should('be.visible').click()
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('nominal case', () => {
    // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
    cy.wait(1000)
    cy.get(emailInput).type(`${email1}`)
    cy.get('.shareDownload__buttons__newBtn').should('be.visible').click()
    cy.get('.shareLink__linkInfos__email').contains(email1).should('be.visible')
  })

  it('separating emails by space then pressing Enter, should separate the emails by new line', () => {
    // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
    cy.wait(1000)
    cy.get(emailInput).type(`${email1},${email2},${email3}`).should('be.visible').type('{enter}')
    cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
  })

  it('separating emails by commas then pressing Enter, should separate the emails by new line', () => {
    // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
    cy.wait(1000)
    cy.get(emailInput).type(`${email1},${email2},${email3}`).should('be.visible').type('{enter}')
    cy.get(emailInput).contains(`${email1}\n${email2}\n${email3}`).should('be.visible')
  })

  describe('protected by password', () => {
    it('Should include the input', () => {
      cy.get('.shareDownload__password__link').should('be.visible').click()
      cy.get('.shareDownload__password__wrapper').should('be.visible')
    })

    it('Should be possible to unhide the password', () => {
      cy.get('.shareDownload__password__link').should('be.visible').click()
      // INFO - B.L - 2019.09-13 Adds wait to be sure formatting on the input is loaded otherwise it randomly breaks "type"
      cy.wait(1000)
      cy.get('.shareDownload__password__input').should('be.visible').type('Password')
      cy.get('[data-cy=seePassword]').should('be.visible').click()
      cy.get('.shareDownload__password__input').should('have.value', 'Password')
    })
  })
})
