<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="USER(current_user, user)">
    ## SIDEBAR RIGHT
    <div>
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
        <a title="${_('Edit current user')}" class="btn btn-default" data-toggle="modal" data-target="#user-edit-modal-dialog" data-remote="${user_edit_url}" >${ICON.FA('fa-edit t-less-visible')} ${_('Edit user')}</a>

            % if tmpl_context.auth_is_internal:
                <a title="${_('Change password')}" class="btn btn-default" data-toggle="modal" data-target="#user-edit-password-modal-dialog" data-remote="${user_password_edit_url}" >${ICON.FA('fa-key t-less-visible')} ${_('Password')}</a>
            % endif

        </div>
        <p></p>
        % if current_user.profile.id>2 and current_user.id!=user.id:
        <div class="btn-group btn-group-vertical">
            % if user.enabled:
                <a title="${_('Disable user')}" class="btn btn-default" href="${tg.url('/admin/users/{}/disable?next_url=user'.format(user.id))}">${ICON.FA('fa-lightbulb-o fa-fw t-disabled-color')} ${_('Disable')}</a>
            % else:
                <a title="${_('Enable user')}" class="btn btn-default" href="${tg.url('/admin/users/{}/enable?next_url=user'.format(user.id))}">${ICON.FA('fa-lightbulb-o fa-fw t-enabled-color')} ${_('Enable')}</a>
            % endif
        </div>
        % endif
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

<%def name="USER_ME(current_user)">
    ## SIDEBAR RIGHT
    <div class="btn-group btn-group-vertical">
        <%
            user_edit_url = tg.url('/user/{}/edit'.format(current_user.id), {'next_url': '/home'})
            user_password_edit_url = tg.url('/user/{}/password/edit'.format(current_user.id))
        %>
        <a title="${_('Edit my profile')}" class="btn btn-default edit-profile-btn" data-toggle="modal" data-target="#user-edit-modal-dialog" data-remote="${user_edit_url}" >${ICON.FA('fa-edit t-less-visible')} ${_('Edit my profile')}</a>

        % if tmpl_context.auth_is_internal:
            <a title="${_('Change password')}" class="btn btn-default change-password-btn" data-toggle="modal" data-target="#user-edit-password-modal-dialog" data-remote="${user_password_edit_url}" >${ICON.FA('fa-key t-less-visible')} ${_('Password')}</a>
        % endif
    </div><!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

<%def name="USERS(current_user)">
    ## SIDEBAR RIGHT
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar bg-secondary">
        <div class="btn-group btn-group-vertical">
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

