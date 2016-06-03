import caldav
from radicale import ical

#
# Run it in gearbox command with app context (radicale must running)
# pip package caldav==0.4.0 must be installed
# run following


client = caldav.DAVClient('http://127.0.0.1:5232',
                          username='admin@admin.admin',
                          password='admin@admin.admin')

calendar = caldav.Calendar(
    parent=client,
    client=client,
    id='/user/1.ics/',
    # url='http://127.0.0.1:5232/user/1.ics/'
)

calendar.save()

# FOR EACH EVENT IN THIS CALENDAR:

coll = ical.Collection.from_path('/user/1.ics/')[0]
with coll.filesystem_only():
    coll.append(name='THE EVENT NAME (ID)', text='THE ICS EVENT RAW')


pass