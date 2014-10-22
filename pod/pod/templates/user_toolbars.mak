<%namespace name="POD" file="pod.templates.pod"/>

<%def name="USER(current_user, user)">
    ## SIDEBAR RIGHT
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">
        <div class="btn-group btn-group-vertical">
            <%
                if current_user.id!=user.id:
                    user_edit_url = tg.url('/admin/users/{}/edit'.format(user.id))
                    user_password_edit_url = tg.url('/admin/users/{}/password/edit'.format(user.id))
                else:
                    user_edit_url = tg.url('/user/{}/edit'.format(user.id))
                    user_password_edit_url = tg.url('/user/{}/password/edit'.format(user.id))
                endif
            %>
            <a title="${_('Edit current user')}" class="btn btn-default" data-toggle="modal" data-target="#user-edit-modal-dialog" data-remote="${user_edit_url}" >${POD.ICO(32, 'apps/accessories-text-editor')}</a>
            <a title="${_('Change password')}" class="btn btn-default" data-toggle="modal" data-target="#user-edit-password-modal-dialog" data-remote="${user_password_edit_url}" >${POD.ICO(32, 'actions/system-lock-screen')}</a>
        </div>
        <p></p>
        % if current_user.profile.id>=2 and current_user.id!=user.id:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Delete current workspace')}" class="btn btn-default" href="${tg.url('/user/{}/delete'.format(user.id))}">${POD.ICO(32, 'status/user-trash-full')}</a>
        </div>
        % endif
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

<%def name="USERS(current_user)">
    ## SIDEBAR RIGHT
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">
        <div class="btn-group btn-group-vertical">
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

