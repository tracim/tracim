<%inherit file="local:templates.help.page"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">${_('Wiki page definition')}</%def>

<%def name="content()">
    <p>${_('A wiki page is a document you write and modify online.')|n}</p>
    <p>${_('It\'s a wikipedia-like page dedicated to your workspace.')}</p>
    <p>
        ${_('It can contain:')|n}
        <ul>
            <li>${_('text,')}</li>
            <li>${_('images,')}</li>
            <li>${_('links,')}</li>
            <li>${_('tables,')}</li>
            <li>...</li>
        </ul>
    </p>
</%def>

