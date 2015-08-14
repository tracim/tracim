<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="USER_PROFILE(user)">
    % if user.profile.id >= 1:
        <p>${ICON.FA('fa-male t-green fa-lg fa-fw')}<span> ${_('This user a standard user.')}</span></p>
    %else:
        <p class="t-disabled-color">${ICON.FA('fa-male fa-lg fa-fw')}<span> ${_('This user a standard user.')}</span></p>
    % endif

    % if user.profile.id >= 2:
        <p>${ICON.FA('fa-graduation-cap t-orange fa-lg fa-fw')} ${_('This user can create workspaces.')}</p>
    % else:
        <p class="t-disabled-color">${ICON.FA('fa-graduation-cap fa-lg fa-fw')} ${_('This user can create workspaces.')}</p>
## FIXME - ALLOW TO CHANGE USER ROLE IN USER VIEW
##        <p>${BUTTON.FA(icon, 'blabl', tg.url('/admin/users/{}/profile/switch?new_role={}'.format(user.id, 'tracim-profile-manager')), user, 3)}</p>
##
##        <% link_url = tg.url('/admin/users/{}/profile/switch?new_role={}'.format(user.id, 'tracim-profile-manager')) %>
##            <a class="t-less-visible" href="${link_url}">blabla</a>
    % endif

    % if user.profile.id >= 3:
        <p>${ICON.FA('fa-legal t-red fa-lg fa-fw ')} ${_('This user is an administrator.')}</p>
    % else:
        <p class="t-disabled-color">${ICON.FA('fa-legal fa-lg fa-fw ')} ${_('This user is an administrator.')}</p>
    % endif
</%def>

<%def name="USER_CONTACT(user)">
    <p>
        ${ICON.FA('fa-envelope-o fa-lg fa-fw t-less-visible')}
        <span><a href="mailto:${result.user.email}">${result.user.email}</a></span>
    </p>
</%def>

<%def name="EMPTY_CONTENT(empty_content_label)"><p class="pod-empty">${empty_content_label}</p></%def>
