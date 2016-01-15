/*
 * util.c
 *
 *  Created on: Sep 15, 2015
 *      Author: robert
 */
#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include "util.h"

#define MAX_BUF 40

char machineID[MAX_BUF]="";

char *trimwhitespace(char *str)
{
  char *end;

  // Trim leading space
  while (isspace(*str))
  {
    str++;
  }

  // All spaces?
  if (*str == 0)
  {
    return str;
  }

  // Trim trailing space
  end = str + strlen(str) - 1;
  while (end > str && isspace(*end)) {
    end--;
  }

  // Write new null terminator
  *(end + 1) = 0;

  return str;
}

char* GetMachineID()
{
	FILE *fptr ;
	fptr = fopen("/etc/machine-id","r");
	if(!fptr)
		return NULL;

	//read the machine-id
	while (fgets(machineID, MAX_BUF, fptr)!=NULL);

	return trimwhitespace(machineID);
}
