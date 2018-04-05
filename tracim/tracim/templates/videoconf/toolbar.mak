<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%namespace name="TIM" file="tracim.templates.pod"/>


<%def name="JITSIMEETROOM(current_user, workspace,jitsi_meet_room)">
    ## SIDEBAR RIGHT
    <div>
        <div class="btn-group btn-group-vertical">
           ## INFO - G.M - 09-01-2018 - Share a link disabled, because
           ## link doesn't refresh.
           ## <a title="${_('Invite by sharing a link')}" class="btn btn-default" data-toggle="modal" data-target="#videoconf-invite-modal-dialog" data-remote="${tg.url('/workspaces/{}/videoconference/invite'.format(result.workspace.id))}" >${ICON.FA('fa-share fa-fw t-less-visible')} ${_('Invite')}</a>
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>