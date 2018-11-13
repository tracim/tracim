Cypress.Commands.add('addUserToWorkspace', (userId, workspaceId, role = 'contributor') => {
  const body = {
    role: role,
    user_id: userId
  }
  cy.request('POST', `/api/v2/workspaces/${workspaceId}/members`, body)
})

Cypress.Commands.add('createUser', (fixturePath = 'baseUser') => {
  return cy
    .fixture(fixturePath)
    .then(userJSON => cy.request('POST', '/api/v2/users', userJSON))
    .then(response => response.body)
})

Cypress.Commands.add('createWorkspace', (fixturePath = 'baseWorkspace') => {
  return cy
    .fixture(fixturePath)
    .then(workspaceJSON => cy.request('POST', '/api/v2/workspaces', workspaceJSON))
    .then(response => response.body)
})

Cypress.Commands.add('setupBaseDB', () => {
  const accum = (...cmds) => {
    const results = []

    cmds.forEach((cmd) => {
      cmd().then(results.push.bind(results))
    })

    return cy.wrap(results)
  }
  cy.login('administrators')
  accum(
    cy.createUser,
    cy.createWorkspace
  )
    .then(([user, workspace]) => {
      cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
    })
    .then(() => cy.logout())
})

Cypress.Commands.add('resetDB', () => {
  cy
    .exec('tracimcli db delete --force -c ../backend/development.ini')
    .then(cmd => cy.log(cmd.stdout))
    .then(cmd => cy.exec('tracimcli db init -c ../backend/development.ini'))
    .then(cmd => cy.log(cmd.stdout))
})
