#!/bin/bash

# ============= LOAD ENV VARIABLES ============= #
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found!"
  exit 1
fi

CITY=${1:-Lahore}   # default Lahore

# ============= FETCH WEATHER ============= #
RESPONSE=$(curl -s "https://api.openweathermap.org/data/2.5/weather?q=$CITY&appid=$OPENWEATHER_API_KEY&units=metric")

# Extract fields manually (regex parsing)
CITY_NAME=$(echo $RESPONSE | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')
TEMP=$(echo $RESPONSE | sed -n 's/.*"temp":\([^,]*\).*/\1/p')
CONDITION=$(echo $RESPONSE | sed -n 's/.*"main":"\([^"]*\)".*/\1/p' | head -n 1)
TIMEZONE=$(echo $RESPONSE | sed -n 's/.*"timezone":\([^,}]*\).*/\1/p')

# Convert timezone offset to local time
CURRENT_TIME=$(date -u -d "@$(( $(date +%s) + $TIMEZONE ))" +"%I:%M %p")

# ============= FORMAT REPORT ============= #
REPORT="Weather Report for $CITY_NAME
Temperature: ${TEMP}\u00B0C
Condition: $CONDITION
Reported Time: $CURRENT_TIME"

echo "$REPORT"

# ============= SEND TO SLACK ============= #
curl -s -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$REPORT\"}" \
    $SLACK_WEBHOOK_URL

# ============= LOGGING ============= #
mkdir -p logs
LOG_FILE="logs/weather.log"
{
  echo "----- $(date) -----"
  echo "City: $CITY"
  echo "Response: $RESPONSE"
  echo ""
} >> $LOG_FILE
