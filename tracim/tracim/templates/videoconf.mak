<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="TOOLBAR" file="tracim.templates.user_toolbars"/>

<%def name="title()">
    ${_('VideoConf')}
</%def>

<%def name="TITLE_ROW()">
    ##<div class="content__title">
    ##    ${ROW.TITLE_ROW(_('My Dashboard'), 'fa-home', 'content__title__subtitle-home-hidden-xs', 't-user-color', _('Welcome to your home, {username}.').format(username=fake_api.current_user.name))}
    ##</div>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
   ## ${TOOLBAR.USER_ME(fake_api.current_user)}
</%def>


<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    ##${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('user-edit-modal-dialog')}
    ${TIM.MODAL_DIALOG('user-edit-password-modal-dialog')}
</%def>

<div class="content__home">
    <div id="jitsi">
    </div>
    <script src="https://prosody/libs/external_api.min.js"></script>
    <script>
        //This example use jitsi-external API. Using lib-jitsi-meet is also a possibility.
        // It support alls jitsi-meet features.
        // About support for "private (1-to-1) text message into room", check this :
        // https://github.com/jitsi/lib-jitsi-meet/pull/616
        var domain = "prosody";
        var options = {
	    // jitsi-meet support now(10-2017) only one way to auto-auth, token,
	    // which is anonymous BOSH auth with specific url (with token value in params of the url).
	    jwt:"INSERTTOKENHERE",
            roomName : "test",
            parentNode: document.querySelector('#jitsi'),
	    // has external API use iframe, height is a problem
            height: 800,
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
        api.executeCommand('displayName', 'Bidule');
        // We can override also avatar.
        api.executeCommand('avatarUrl', 'https://avatars0.githubusercontent.com/u/3671647');
    </script>
</div>

