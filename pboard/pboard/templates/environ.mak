<%inherit file="local:templates.master"/>

<%def name="title()">
  Learning TurboGears 2.3: Information about TG and WSGI
</%def>

<h2>The WSGI nature of the framework</h2>
  <p>In this page you can see all the WSGI variables your request object has, 
     the ones in capital letters are required by the spec, then a sorted by
     component list of variables provided by the Components, and at last
     the "wsgi." namespace with very useful information about your WSGI Server</p>
  <p>The keys in the environment are: 
  <table class="table">
      %for key in sorted(environment):
      <tr>
          <td>${key}</td>
          <td>${environment[key]}</td>
      </tr>
      %endfor
  </table>

  </p>

