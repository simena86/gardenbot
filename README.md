Raspberry Pi Garden Bot
===================================

Water your plants and monitor humidity over internet


### Notes:

Using rpi-gpio to control gpio ports of the pi. Using gpio-admin to make ports available withot root privelege, using the command:

gpio-admin export 21 

where 21 is the port controlling the pump.
