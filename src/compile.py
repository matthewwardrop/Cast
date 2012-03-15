#!/usr/bin/python

import sys,os,re

RELATIVE_PATH = os.path.dirname(os.path.relpath(__file__))
MODULES_DIR = "modules"
TEMPLATE_FILE = "wrapper.js"
PLACEHOLDER_TEXT = "//%CAST_SCRIPTS"

if len(sys.argv) < 2:
	print "Usage: compile.py <output_filename> [<excluded files>]"
	sys.exit(1)

def outputToFile(filename,contents):
	f = open(filename,'w')
	f.write(contents)
	f.close()

def getFile(filename):
	print os.path.join(RELATIVE_PATH,filename)
	f = open(os.path.join(RELATIVE_PATH,filename),'Ur')
	contents = f.read()
	f.close()
	return contents

def getModules():
	output = []
	files = os.listdir(os.path.join(RELATIVE_PATH,MODULES_DIR))
	excluded = sys.argv[2:]
	include = {}
	for filename in files:
		match = re.match("^[a-zA-Z]+.(?P<priority>[0-9]+).js$",filename)
		if match is not None and filename not in excluded:
			priority = match.group('priority')
			include[priority] = include.get(priority,[])
			include[priority].append(filename)
	
	for priority in sorted(include.keys()):
		for filename in include[priority]:
			output.append(getFile(os.path.join(MODULES_DIR,filename)))
	return "\n\n".join(output)

output = getFile(TEMPLATE_FILE).replace(PLACEHOLDER_TEXT,getModules())

outputToFile(sys.argv[1],output)

