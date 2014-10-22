<%inherit file="local:templates.help.page"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">${_('User role definition')}</%def>

<%def name="content()">
    <p>
        ${_('Users have a role for each workspace.')}
    </p>
    <p>
        ${_('Roles give progressive rights on what the user can or can\'t do.')}
    </p>
    <table class="table table-hover">
        <tr>
            <th><span style="color: #1fdb11;">${_('Reader')}</span></th>
            <td>${_('This role gives read-only access to workspace resources.')|n}</td>
        </tr>
        <tr>
            <th><span style="color: #759ac5;">${_('Contributor')}</span></th>
            <td>${_('Same as <span style="color: #1fdb11;">reader</span> + contribution rights: edit, comments, status update.')|n}</td>
        </tr>
        <tr>
            <th><span style="color: #ea983d;">${_('Content Manager')}</span></th>
            <td>${_('Same as <span style="color: #759ac5;">contributor</span> + content management rights: move content, folders management, delete archive operations.')|n}</td>
        </tr>
        <tr>
            <th><span style="color: #F00;">${_('Workspace Manager')}</span></th>
            <td>${_('Same as <span style="color: #ea983d;">content manager</span> + workspace management rights: edit workspace, invite users, revoke them.')|n}</td>
        </tr>
    </table>
</%def>

