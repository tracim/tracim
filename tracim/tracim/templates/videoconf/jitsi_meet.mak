<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="TOOLBAR" file="tracim.templates.videoconf.toolbar"/>

<%def name="title()">
    ${_('VideoConf')}
</%def>

<%def name="TITLE_ROW()">
    <div class="content__title">
    ${ROW.TITLE_ROW(
    _('Video conference'),
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
        //This example use jitsi-external API. Using lib-jitsi-meet is also a possibility.
        // It support alls jitsi-meet features.
        // About support for "private (1-to-1) text message into room", check this :
        // https://github.com/jitsi/lib-jitsi-meet/pull/616
        var domain = '${jitsi_meet_room.domain}';
        var options = {
	    // jitsi-meet support now(10-2017) only one way to auto-auth, token,
	    // which is anonymous BOSH auth with specific url (with token value in params of the url).
            %if jitsi_meet_room.token_config:
                jwt: '${jitsi_meet_room.generate_token()}',
            %endif
            roomName : '${jitsi_meet_room.room}',
            parentNode: document.querySelector('#jitsi'),
	    // has external API use iframe, height is a problem
            height: 700,
            no_SSL: true,
            configOverwrite: {
                 enableWelcomePage: false,
                 enableUserRolesBasedOnToken: true,
                // Example of how it can be possible to use others auths.
                // This solution has some security issue.
                // see this rejected PR : https://github.com/jitsi/jitsi-meet/pull/2109
                // roomPassword: "plop",
                // userJid: "john@auth.prosody",
                // userPassword: "j",

            },
            interfaceConfigOverwrite: {
                // DEFAULT_BACKGROUND: '#FFFFFF',
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
        var api = new JitsiMeetExternalAPI(domain, options);
        // Display name in jitsi-meet use XEP-0172 for MUC, which is discouraged,
        // when others clients use resource part of the Jabber id to do it.
        // That's why displayName compat with others XMPP client is not optimal.
        // check this : https://github.com/jitsi/jitsi-meet/pull/2068
        api.executeCommand('displayName', '${fake_api.current_user.name}');
        // We can override also avatar.
        api.executeCommand('avatarUrl', 'https://avatars0.githubusercontent.com/u/3671647');
    </script>
</div>

<div id="videoconf-invite-modal-dialog" class="modal bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
    </div>
  </div>
</div>