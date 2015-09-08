<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="SECURED_THREAD(user, workspace, thread)">
    <div class="btn-group btn-group-vertical">
        ${BUTTON.MARK_CONTENT_READ_OR_UNREAD(user, workspace, thread)}
    </div>
    <hr class="t-toolbar-btn-group-separator"/>
    <p></p>

    <% edit_disabled = ('', 'disabled')[thread.selected_revision!='latest' or thread.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[thread.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>1:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current thread')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#thread-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/threads/{}/edit'.format(thread.workspace.id, thread.parent.id, thread.id))}" >
                ${ICON.FA_FW('t-less-visible fa fa-edit')}
                ${_('Edit')}
            </a>
        </div>
        <p></p>
    % endif
    
    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/threads/{}/put_archive'.format(thread.workspace.id, thread.parent.id, thread.id))}">
                ${ICON.FA_FW('t-less-visible fa fa-archive')}
                ${_('Archive')}
            </a>
            <a title="${_('Delete thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/threads/{}/put_delete'.format(thread.workspace.id, thread.parent.id, thread.id))}">
                ${ICON.FA_FW('t-less-visible fa fa-trash')}
                ${_('Delete')}
            </a>
        </div>
    % endif
</%def>

