import { PAGES } from '../../support/urls_commands'
import baseWorkspace from '../../fixtures/baseWorkspace.json'
import baseOtherUser from '../../fixtures/baseOtherUser.json'
import defaultAdmin from '../../fixtures/defaultAdmin.json'

describe("Editing the user profile", () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.login(defaultAdmin)
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: defaultAdmin.user_id } })
  })

  describe('Information form', () => {
    describe('while receiving a TLM', () => {
      it('should not have reset the value of the first input', () => {
        cy.get(`[data-cy=CustomFormManager__updateProfile__edit__button]`)
          .first()
          .should('be.visible')
          .click()

        const expectedText = 'some text'
        cy.get('form.rjsf .form-group > input[type="text"]')
          .first()
          .type(expectedText)

        cy.createUser('baseOtherUser').then(user => {
          cy.addUserToWorkspace(user.user_id, baseWorkspace.workspace_id)

          cy.clearCookies() // CH - INFO - 20210128 - clearing cookies to force use basic auth to create the content with baseOtherUser

          cy.request({
            method: 'POST',
            url: `/api/workspaces/${baseWorkspace.workspace_id}/contents`,
            auth: {
              user: baseOtherUser.email,
              pass: baseOtherUser.password
            },
            body: {
              content_type: 'html-document',
              label: 'some note'
            }
          }).then(() => {
            cy.wait(300) // INFO - CH - wait for the TLM to have been triggered

            cy.get('form.rjsf .form-group > input[type="text"]')
              .first()
              .invoke('val')
              .then(inputText => {
                expect(inputText).to.equal(expectedText)
              })
          })
        })
      })
    })
  })

})
