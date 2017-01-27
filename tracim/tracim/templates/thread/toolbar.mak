<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="SECURED_THREAD(user, workspace, thread)">

    % if thread.is_editable:
        <div class="btn-group btn-group-vertical">
            ${BUTTON.MARK_CONTENT_READ_OR_UNREAD(user, workspace, thread)}
        </div>
        <hr class="t-toolbar-btn-group-separator"/>
        <p></p>
    % endif

    <% edit_disabled = ('', 'disabled')[thread.selected_revision!='latest' or thread.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[thread.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>1 and thread.is_editable:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current thread')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#thread-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/threads/{}/edit'.format(thread.workspace.id, thread.parent.id, thread.id))}" >
                ${ICON.FA_FW('t-less-visible fa fa-edit')}
                ${_('Edit')}
            </a>
        </div>
        <p></p>
    % endif
    
    % if (user.profile.id>=3 or h.user_role(user, workspace)>=4) and thread.is_editable:
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

    % if thread.is_deleted or thread.is_archived:
        <div class="btn-group btn-group-vertical">
            % if thread.is_archived:
                <a title="${_('Restore')}"
                   class="btn btn-default"
                   href="${tg.url('/workspaces/{}/folders/{}/threads/{}/put_archive_undo'.format(thread.workspace.id, thread.parent.id, thread.id))}">
                    <i class="fa fa-archive fa-fw tracim-less-visible"></i>
                    ${_('Restore')}
                </a>
            % endif
            % if thread.is_deleted:
                <a title="${_('Restore')}"
                   class="btn btn-default"
                   href="${tg.url('/workspaces/{}/folders/{}/threads/{}/put_delete_undo'.format(thread.workspace.id, thread.parent.id, thread.id))}">
                    <i class="fa fa-archive fa-fw tracim-less-visible"></i>
                    ${_('Restore')}
                </a>
            % endif
        </div>
        <p></p>
    % endif

</%def>

