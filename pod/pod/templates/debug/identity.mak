<%inherit file="local:templates.master"/>

<%def name="title()">
pod :: debug :: request.identity
</%def>

<h2>Identity object</h2>
  <table class="table">
      %for key in sorted(identity):
      <tr>
          <td>${key}</td>
          <td>${identity[key]}</td>
      </tr>
      %endfor
  </table>

