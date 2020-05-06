## Setting Up Live messages for dev usage

~~~bash
apt install pushpin
cd backend
pserve development.ini &
cd ..
pushpin --config pushpin_dev.conf --route '* localhost:6543' &
firefox localhost:7998
~~~
