/*
 * led.c
 *
 *  Created on: Sep 8, 2015
 *      Author: robert
 */

#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include "led.h"



static const char* user_led1 = "/sys/class/leds/apq8016-sbc:green:user0/brightness";
static const char* user_led2 = "/sys/class/leds/apq8016-sbc:green:user1/brightness";
static const char* user_led3 = "/sys/class/leds/apq8016-sbc:green:user2/brightness";
static const char* user_led4 = "/sys/class/leds/apq8016-sbc:green:user3/brightness";

int GetLEDState(UserLed user_led, LED_State* state)
{
	char val;
	const char* led=NULL;

	switch(user_led)
	{
	case UserLED_1:
		led = user_led1;
		break;
	case UserLED_2:
		led = user_led2;
		break;
	case UserLED_3:
		led = user_led3;
		break;
	case UserLED_4:
		led = user_led4;
		break;
	}

	int led_fd = open( led, O_RDONLY);
	if(led_fd < 0)
		return -1;

	// Read the GPIO value
	read(led_fd, &val, 1);
	*state = atoi(&val);
	return 0;
}

int SetLEDState(UserLed user_led, LED_State state)
{
	const char* led=NULL;
	char buffer[5];

	switch(user_led)
	{
	case UserLED_1:
		led = user_led1;
		break;
	case UserLED_2:
		led = user_led2;
		break;
	case UserLED_3:
		led = user_led3;
		break;
	case UserLED_4:
		led = user_led4;
		break;
	}

	int led_fd = open( led, O_WRONLY);
    if(led_fd < 0)
    	return -1;

    //Write brightness file
    sprintf(buffer, "%d", state);
    write(led_fd, buffer, strlen(buffer));

    close(led_fd);
    return 0;
}

int TurnOn_LED(UserLed user_led)
{
	return SetLEDState(user_led, LED_ON);
}

int TurnOFF_LED(UserLed user_led)
{
	return SetLEDState(user_led, LED_OFF);
}

int ToggleLED(UserLed user_led)
{
	int ret;
	LED_State state;

	ret = GetLEDState(user_led, &state);
	if (ret!=0)
		return -1;
	return SetLEDState(user_led, !state);
}
