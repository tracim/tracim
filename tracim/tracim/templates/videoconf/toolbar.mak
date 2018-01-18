<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%namespace name="TIM" file="tracim.templates.pod"/>


<%def name="JITSIMEETROOM(current_user, workspace,jitsi_meet_room)">
    ## SIDEBAR RIGHT
    <div>
        <div class="btn-group btn-group-vertical">
            <a title="${_('Full-size')}" class="btn btn-default" href="${jitsi_meet_room.generate_url()}" >${ICON.FA('fa-arrows-alt fa-fw t-less-visible')} ${_('Full-size')}</a>
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>
