#!/usr/bin/python

#
# Sample CGI for sending data to Cast JS instances.
#


print "Content-Type: text/plain;\r\n\r\n"

import simplejson as json
import sys,traceback

import cgitb
cgitb.enable()

# Import modules for CGI handling 
import cgi
 
 # Create instance of FieldStorage 
form = cgi.FieldStorage() 

final_output = json.dumps(
	{
		"cast_order": ["layout"],
		"layout": {"header":True, "menubar": True,"title": True},
		"toolbar": ["stack"],
		"content":  {
			"view":"array",
			"view_opts": {
				"scroll": True,
				"array": { 
					"test":[ 
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} }
					],
					"test2":[ 
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} }
					],
					"test3":[ 
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} },
						{"view":"icon","view_opts":{"src":"test.png"} }
					] 
				}
			}
		},
	}
)

if form.getvalue('test'):
	final_output['title'] = "YOHO!"

if form.getvalue('callback'):
	print "%s(%s)" % (form.getvalue('callback'),final_output)
else:
	print final_output
