# Devtools

# Make request in CLI

## upload a file

    http --timeout 99999999999999 -f POST  http://127.0.0.1:8080/workspaces/1/folders/2/files label='test3' file_data@~/Téléchargements/fr_windows_8_1_x86_dvd_2707457.iso 'Cookie: authtkt="ec5249770f9709d6c5aec5caf458c0875ab8eeefadmin%40admin.admin!"'

# Check third party licences

Install `yolk3k` pip package:

    pip install yolk3k

Then execute command:

    yolk -l -f license

Output will look like:

```
Babel (2.2.0)
    License: BSD

Beaker (1.6.4)
    License: BSD

CherryPy (3.6.0)
    License: BSD

FormEncode (1.3.0a1)
    License: PSF

Genshi (0.7)
    License: BSD
...
```
