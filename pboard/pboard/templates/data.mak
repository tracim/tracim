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

  <div class="well span3 text-center">
    <div>
    </div>
    <table id='keyboard'>
      <tr>
        <td colspan="5">
          <input type='text' class="text-right" id='calculation'/><br/>
          <input type='text' class="text-right" readonly id='result'/>
        </td>
      </tr>
      <tr>
        <td><span class='btn'>7</span></td>
        <td><span class='btn'>8</span></td>
        <td><span class='btn'>9</span></td>
        <td><span class='btn'>(</span></td>
        <td><span class='btn'>)</span></td>
      </tr>
      <tr>
        <td><span class='btn'>4</span></td>
        <td><span class='btn'>5</span></td>
        <td><span class='btn'>6</span></td>
        <td><span class='btn'>-</span></td>
        <td><span class='btn'>+</span></td>
      </tr>
      <tr>
        <td><span class='btn'>1</span></td>
        <td><span class='btn'>2</span></td>
        <td><span class='btn'>3</span></td>
        <td><span class='btn'>/</span></td>
        <td><span class='btn'>*</span></td>
      </tr>
      <tr>
        <td><span class='btn'>.</span></td>
        <td><span class='btn'>0</span></td>
        <td><span class='btn'>%</span></td>
        <td><span class='btn btn-success'>=</span></td>
        <td><span class='btn btn-danger'>C</span></td>
      </tr>
    </table>
    <script src="http://code.jquery.com/jquery.js"></script>
    <script src="${tg.url('/javascript/bootstrap.min.js')}"></script>

    <script>
      $(document).ready(function() {
        $('#keyboard span').on('click', function (e) {
          current_value = $(this).text()
          if(current_value=='C') {
            $('#calculation').val('');
            $('#result').val('');
          } else if(current_value=='=') {
            string = $('#calculation').val().replace(/[^0-9+-/\*\%\(\)]/gi, ''); // replace('/[^0-9()*/-+]/g', "");
            console.log("Compute value of "+string)
            calculation = eval(string);
            console.log("Result is: "+calculation)
            $('#result').val(calculation)
          } else {
            field = $('#calculation')
            field.oldval = field.val();
            field.val(field.oldval+current_value)
          }
        });
      });
    </script>
  </div>
