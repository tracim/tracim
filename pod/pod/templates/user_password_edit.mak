<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="FORMS" file="pod.templates.user_workspace_forms"/>
<%def name="title()"></%def>

${FORMS.USER_PASSWORD_EDIT_FORM('user-edit-form', result.user, tg.url('/admin/users/{}/password?_method=PUT'.format(result.user.id)))}

