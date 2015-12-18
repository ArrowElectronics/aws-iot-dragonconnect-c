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
#include "util.h"

#define MAX_BUF 40

char machineID[MAX_BUF]="";

char* GetMachineID()
{
	FILE *fptr ;
	fptr = fopen("/etc/machine-id","r");
	if(!fptr)
		return NULL;

	//read the machine-id
	while (fgets(machineID, MAX_BUF, fptr)!=NULL);

	return machineID;
}
