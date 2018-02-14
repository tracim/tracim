<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="TOOLBAR" file="tracim.templates.videoconf.toolbar"/>

<%def name="title()">
    ${_('Video conference: {workspace}').format(workspace=result.workspace.label)}
</%def>

<%def name="TITLE_ROW()">
    <div class="content__title">
    ${ROW.TITLE_ROW(
    _('Video conference: {workspace}').format(workspace=result.workspace.label),
    'fa-video-camera', 'content__title__subtitle-home-hidden-xs',
    't-user-color', _('Welcome to video conference of {workspace}, {username}.').format(workspace=
    result.workspace.label,
    username=fake_api.current_user.name))}
    </div>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.JITSIMEETROOM(fake_api.current_user, result.workspace, jitsi_meet_room)}
</%def>


<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', 'workspace_{}__'.format(result.workspace.id))}
</%def>

<%def name="REQUIRED_DIALOGS()">
</%def>

<div class="content__home">
    <div id="jitsi">
    </div>
    <script src="https://${jitsi_meet_room.domain}/libs/external_api.min.js"></script>
    <script>
        let domain = '${jitsi_meet_room.domain}';
        let options = {
	    // INFO - G.M - 14-02-2018 jitsi-meet external API
        // support only one way to auto-auth due to security concern : token,
	    // which is anonymous BOSH auth with specific url
        // for another way to deal with auto-auth :
        // see this rejected PR : https://github.com/jitsi/jitsi-meet/pull/2109
            %if jitsi_meet_room.use_token:
                jwt: '${jitsi_meet_room.generate_token()}',
            %endif
            roomName : '${jitsi_meet_room.room}',
            parentNode: document.querySelector('#jitsi'),
            // TODO - G.M - 14-02-2018 - Find a solution to height trouble.
            // height should be related to page size
            height: 700,
            no_SSL: true,
            configOverwrite: {
                 enableWelcomePage: false,
                 enableUserRolesBasedOnToken: true,
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_POWERED_BY: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                LANG_DETECTION: true,
                USE_ID_AS_DEFAULT_DISPLAY_NAME: true,
                TOOLBAR_BUTTONS: [
                    //main toolbar
                    'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', // jshint ignore:line
                    //extended toolbar
                    'contacts', 'settings', 'raisehand', 'videoquality','hangup','chat'], // jshint ignore:line
                MAIN_TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection',
                    'contacts', 'info', 'settings', 'raisehand', 'videoquality','hangup'] // jshint ignore:line
            }

        };
        let api = new JitsiMeetExternalAPI(domain, options);
        // Display name in jitsi-meet use XEP-0172 for MUC, which is discouraged,
        // when others clients use resource part of the Jabber id to do it.
        // That's why displayName compat with others XMPP client is not optimal.
        // check this : https://github.com/jitsi/jitsi-meet/pull/2068
        % if jitsi_meet_room.context and jitsi_meet_room.context.user:
            %if jitsi_meet_room.context.user.name:
            api.executeCommand('displayName', '${jitsi_meet_room.context.user.name}');
            %endif
            // We can override also avatar.
            %if jitsi_meet_room.context.user.avatar_url:
            api.executeCommand('avatarUrl', '${jitsi_meet_room.context.user.avatar_url}');
            %endif
        % endif
    </script>
</div>
<div id="videoconf-invite-modal-dialog" class="modal bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
    </div>
  </div>
</div>