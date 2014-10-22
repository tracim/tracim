<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="FORMS" file="pod.templates.user_workspace_forms"/>

<%def name="title()"></%def>

${FORMS.USER_EDIT_FORM('user-edit-form', result.user, tg.url('/user/{}?_method=PUT'.format(result.user.id)))}

