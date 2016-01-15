#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <unistd.h>

#include <signal.h>
#include <memory.h>
#include <sys/time.h>
#include <limits.h>
#include <linux/input.h>

#include "glib.h"
#include "cJSON.h"
#include "gpio.h"
#include "led.h"
#include "mqtt.h"
#include "util.h"
#include "mtime.h"

#define MAX_BUF 40
#define MAX_PAYLOAD 100
#define VOL_UP_EVENT   "/dev/input/event1"
#define VOL_DOWN_EVENT "/dev/input/event0"

//Prototypes
int RegisterEventHandler(char *event, GIOFunc  event_fp, void* context);
gboolean On_VolUp_ButtonPress(GIOChannel *source, GIOCondition condition, gpointer data);
gboolean On_VolDown_ButtonPress(GIOChannel *source, GIOCondition condition, gpointer data);

//TODO: Move these in a separate file
int MSG_GetDesiredState( int payload_len, char * payload, bool *des_state);
int MSG_SetReportedState( int payload_len, char * payload, bool rep_state);

//Globals
char certDirectory[PATH_MAX + 1] = "../certs";
char HostAddress[255] = "INVALID_HOST_SEE_USER_GUIDE";
uint16_t port = 8883;

char vol_button_topic[]="things/%s/audio/events";
char led_state_sub_topic[]="$aws/things/%s/shadow/update/delta";
char led_state_pub_topic[]="$aws/things/%s/shadow/update";

GMainLoop* loop = NULL;

/*******************************************************************************
*	parseInputArgsForConnectParams
*
********************************************************************************/
void parseInputArgsForConnectParams(int argc, char** argv) {
	int opt;

	while (-1 != (opt = getopt(argc, argv, "h:p:c:"))) {
		switch (opt) {
		case 'h':
			strcpy(HostAddress, optarg);
			DEBUG("Host %s", optarg);
			break;
		case 'p':
			port = atoi(optarg);
			DEBUG("arg %s", optarg);
			break;
		case 'c':
			strcpy(certDirectory, optarg);
			DEBUG("cert root directory %s", optarg);
			break;
		case '?':
			if (optopt == 'c') {
				ERROR("Option -%c requires an argument.", optopt);
			}
			else if (isprint(optopt)) {
				WARN("Unknown option `-%c'.", optopt);
			}
			else {
				WARN("Unknown option character `\\x%x'.", optopt);
			}
			break;
		default:
			ERROR("Error in command line argument parsing");
			break;
		}
	}

}

/*******************************************************************************
*	Signal Handler
*
* Called when CTRL-c is pressed to quit the application
*
********************************************************************************/
void CTRL_C_Handler(int sig)
{
	if(loop)
		g_main_loop_quit (loop);

	INFO("CTRL-c pressed!");
}


gboolean timer_func(gpointer user_data)
{
	//INFO(".");

	// process mqtt traffic during the main loop
	iot_mqtt_yield(10);

 	return 1;
}

/*******************************************************************************
*	Main
*
********************************************************************************/
int main(int argc, char** argv)
{
	IoT_Error_t rc = NONE_ERROR;
	int32_t i = 0;
	int ret =0;

	char rootCA[PATH_MAX + 1];
	char clientCRT[PATH_MAX + 1];
	char clientKey[PATH_MAX + 1];
	char CurrentWD[PATH_MAX + 1];

	char cafileName[] = "/rootCA.crt";
	char clientCRTName[] = "/aws.crt";
	char clientKeyName[] = "/aws.key";

	char* thingID;

	//
	//Register ctrl-c handler
	//
	signal(SIGINT, CTRL_C_Handler);

	//
	//Parse Input-parameters
	//
	parseInputArgsForConnectParams(argc, argv);

	//
	// Get the ThingID/MachineID
	//
	thingID = GetMachineID();

	//
	// Export the vol+/- GPIO's as well as GPIO2 for the LED output
	//
	ret = Export_GPIO(107); 	//Export Vol+ button (GPIO 107)
	if (ret != 0) {
		ERROR("Could not export Vol+/- GPIO");
	}
	ret = Export_GPIO(108); 	//Export Vol- button (GPIO )
	if (ret != 0) {
		ERROR("Could not export Vol+/- GPIO");
	}

	ret = Export_GPIO(2); 	//Export GPIO2 for LED output
	if (ret != 0) {
		ERROR("Could not export Vol+/- GPIO");
	}

	//
	//Register Event-handler for Vol+/- button
	//
	ret = RegisterEventHandler(VOL_UP_EVENT, On_VolUp_ButtonPress, (void*) thingID);
	if (ret != 0) {
		ERROR("Could not register EventHandler");
	}

	ret = RegisterEventHandler(VOL_DOWN_EVENT, On_VolDown_ButtonPress,(void*) thingID);
	if (ret != 0) {
		ERROR("Could not register EventHandler");
	}


	//
	//Create the mainloop for polling the button events
	//
	loop = g_main_loop_new( NULL, false );
	if(!loop) {
		ERROR("Could not Create Main loop");
		return -1;
	}

	//
	//Setting path to private key and certificates
	//
	sprintf(rootCA, "%s%s", certDirectory, cafileName);
	sprintf(clientCRT, "%s%s", certDirectory, clientCRTName);
	sprintf(clientKey, "%s%s", certDirectory, clientKeyName);

	INFO("ThingID:       %s", thingID);
	INFO("AWS IoT SDK:   %d.%d.%d-%s", VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH, VERSION_TAG);
	INFO("rootCA:        %s", rootCA);
	INFO("clientCRT:     %s", clientCRT);
	INFO("clientKey:     %s\n", clientKey);

	struct stat reqFileStat;
	if (stat(rootCA, &reqFileStat) < 0 || stat(clientCRT, &reqFileStat) < 0 ||
	    stat(clientKey, &reqFileStat) < 0)
	{
		ERROR("Root certificate and client certificate and key MUST be present.");
		exit(1);
	}

	//
	// Connect MQTT client
	//
	INFO("Connecting to %s:%d", HostAddress, port);
	rc = MQTT_Connect(HostAddress,port, thingID, rootCA, clientCRT, clientKey);
	if (NONE_ERROR != rc) {
		ERROR("Error[%d] connecting to %s:%d", rc, HostAddress, port);
	}

	//
	// Subscribe to LED status-changes topic
	//
        char topic[512];
        sprintf(topic, led_state_sub_topic, thingID);
	INFO("Subscribing to topic:%s", topic);
	rc = MQTT_Subscribe(topic, QOS_0, MQTTcallbackHandler);
	if (NONE_ERROR != rc) {
		ERROR("Error[%d] subscribing to topic: %s", rc, led_state_sub_topic);
	}


	//iot_mqtt_yield(1000); 	//TODO: clarify

	//
	//Hook in  a function into main loop that calls iot_mqtt_yield in regular intervals
	//
	g_timeout_add(1000, timer_func, 0);



	//
	//start the main loop
	//This call is blocking until the main loop is exited with a call to g_main_loop_quit(loop)
	//from the CTRL-C handler;
	INFO("Entering main-loop, please press ctrl-c to quit the demo-app:");
	g_main_loop_run( loop );	


	INFO("Cleaning up application ...");
	
	//Unsubscribe from Topics

	//Disconnect MQTT connection

	//Unregister GPIO-EventHandlers

	//UnExport GPIO's

	//Destroy main loop
	if(loop)
		g_main_loop_unref(loop);

	return rc;
}

/*******************************************************************************
*
*
********************************************************************************/
int RegisterEventHandler(char *event, GIOFunc  event_fp, void* context)
{
	GIOChannel *c1=NULL;

	c1 = g_io_channel_new_file(event, "r", NULL);
	if(!c1)
		return -1;

	g_io_channel_set_encoding(c1, NULL, NULL);

	//g_io_add_watch(c1, G_IO_IN, event_fp, context);
	g_io_add_watch_full(c1, G_PRIORITY_HIGH, G_IO_IN, event_fp, context, NULL);
	return 0;
}


/*******************************************************************************
*	MQTT Callback Handler
*
*	Is called when the LEd status changes ()
********************************************************************************/
int MQTTcallbackHandler(MQTTCallbackParams params)
{
	IoT_Error_t rc = NONE_ERROR;

	int ret;
	bool des_state, rep_state;
	int payload_len = (int)params.MessageParams.PayloadLen;
	char* payload = (char*)params.MessageParams.pPayload;

	//Receive desired LED state in payload
	INFO("Subscribe callback");
	INFO("%.*s\t%.*s",
				(int)params.TopicNameLen, params.pTopicName,
				(int)params.MessageParams.PayloadLen, (char*)params.MessageParams.pPayload);

	//Read the desired state from message
	ret = MSG_GetDesiredState( payload_len, payload, &des_state);
	if(ret !=0)
		goto JSON_ERROR;

	//Update current LED- and GPIO- state to the desired state
	INFO("Updating state: %d\n",des_state);
	SetLEDState(UserLED_4, des_state);
	Write_GPIO(2, des_state);

	//Write response message
	char msg_payload[MAX_PAYLOAD];
	payload = msg_payload;
	payload_len = MAX_PAYLOAD;

	LED_State led_state;
	GetLEDState(UserLED_4, &led_state);
	ret = MSG_SetReportedState(  payload_len, payload, (int)led_state);
	if(ret !=0)
		goto JSON_ERROR;

	char topic[512];
        sprintf(topic, led_state_pub_topic, GetMachineID());
	printf("Sending payload: %s", payload);
	rc = MQTT_Send_Message(topic, payload, strlen(payload) );
	if (NONE_ERROR != rc)
		ERROR("Could not publish new LED state to topic: %s", topic );

	return 0;

JSON_ERROR:
	ERROR("JSON format Error! %s", (char*)params.MessageParams.pPayload);
	return -1;
}

/*******************************************************************************
*
*
********************************************************************************/
gboolean On_VolUp_ButtonPress(GIOChannel *source, GIOCondition condition, gpointer data)
{
	IoT_Error_t rc = NONE_ERROR;
	GError *error=0;
	char buf[10];
	char payload[MAX_PAYLOAD];
	struct input_event event;
	gsize bytes_read;

	INFO("Vol_Up Button pressed!");


	//read and clear the event
	g_io_channel_seek_position(source, 0, G_SEEK_SET, 0);
	g_io_channel_read_chars(source, (gchar*) &event, sizeof(event), &bytes_read, NULL);
	if(bytes_read >0)
	    printf("Event1: keypress value=%x, type=%x, code=%x\n", event.value, event.type, event.code);

	char* thingID = (char*) data;
	sprintf(payload, "{\n\"timestamp\": %lu, \"volume\": \"%s\" \n}\n", GetTimeSinceEpoch(), "increase");
	printf("%s", payload);

	/**/
	char topic[512];
        sprintf(topic, vol_button_topic, thingID);        
	rc = MQTT_Send_Message(topic, payload, strlen(payload));
	if (NONE_ERROR != rc)
			ERROR("Could not publish event: ");

	return 1;	//indicate event handled
}

/*******************************************************************************
*
*
********************************************************************************/
gboolean On_VolDown_ButtonPress(GIOChannel *source, GIOCondition condition, gpointer data)
{
	IoT_Error_t rc = NONE_ERROR;
	GError *error=0;
	char buf[10];
	char payload[MAX_PAYLOAD];
	struct input_event event;
	gsize bytes_read;

	INFO("Vol_Down Button pressed!");


	//read and clear the event
	g_io_channel_seek_position(source, 0, G_SEEK_SET, 0);
	g_io_channel_read_chars(source, (gchar*) &event, sizeof(event), &bytes_read, NULL);
	if(bytes_read >0)
	    printf("Event0: keypress value=%x, type=%x, code=%x\n", event.value, event.type, event.code);

	char* thingID = (char*) data;
	sprintf(payload, "{\n\"timestamp\": %lu, \"volume\": \"%s\" \n}\n", GetTimeSinceEpoch(), "decrease");
	printf("%s", payload);

	/**/
	char topic[512];
        sprintf(topic, vol_button_topic, thingID);        
	rc = MQTT_Send_Message(topic, payload, strlen(payload));
	if (NONE_ERROR != rc)
			ERROR("Could not publish event: ");

	return 1;	//indicate event handled
}

int MSG_GetDesiredState( int payload_len, char * payload, bool *des_state)
{
	int ret = 0;

	cJSON *root =cJSON_Parse(payload);
	if(!root) {
		ret = -1;
		goto JSON_CLEAN;
	}

	//Get the desired state
	cJSON *state = cJSON_GetObjectItem(root, "state");
	if(!state){
		ret = -1;
		goto JSON_CLEAN;
	}

	*des_state = (bool) cJSON_GetObjectItem(state, "active")->valueint;

	ret = 0; //seems like we succeeded

JSON_CLEAN:

	if(root)
		cJSON_Delete(root);

	return ret;
}

int MSG_SetReportedState( int payload_len, char * payload, bool rep_state)
{
	//Publish the new state
	cJSON *root, *state, *reported_state;
	root = cJSON_CreateObject();
	cJSON_AddItemToObject(root, "state", state = cJSON_CreateObject() );
	cJSON_AddItemToObject(state, "reported", reported_state = cJSON_CreateObject() );

	if (rep_state)
		cJSON_AddTrueToObject(reported_state, "active");
	else
		cJSON_AddFalseToObject(reported_state, "active");

	snprintf( payload, payload_len, "%s", cJSON_Print(root) );


JSON_CLEAN:
	if(root)
		cJSON_Delete(root);

	return 0;
}
