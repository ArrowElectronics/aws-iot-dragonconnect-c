#include <time.h>
#include "mtime.h"

long int GetTimeSinceEpoch()
{
	return time(NULL);
}
