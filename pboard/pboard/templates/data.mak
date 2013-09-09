<%inherit file="local:templates.master"/>

<%def name="title()">
  Welcome to TurboGears 2.3, standing on the shoulders of giants, since 2007
</%def>

<h2>Content Type Dispatch</h2>
<p>
This page shows how you can provide multiple pages
directly from the same controller method.  This page is generated 
from the expose decorator with the template defintion provided.
You can provide a url with parameters and this page will display
the parameters as html, and the json version will express
the entries as JSON.  Here, try it out: <a href="/data.html?a=1&b=2">/data.html?a=1&b=2</a>
</p>

<p>Click here for the <a href="${tg.url('/data.json', params=params)}">JSON Version of this page.</a></p>
<p>The data provided in the template call is: 
    <table>
        %for key, value in params.items():
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        %endfor
    </table>

