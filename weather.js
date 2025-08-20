// weather.js
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

// Get environment variables
const API_KEY = process.env.OPENWEATHER_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const DEFAULT_CITY = process.env.DEFAULT_CITY || "Lahore";

// Get city from command-line args or fallback to default
const city = process.argv[2] || DEFAULT_CITY;

async function fetchWeather() {
  try {
    // OpenWeather API URL
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    // Fetch data
    const response = await axios.get(url);
    const data = response.data;

    // Extract details
    const cityName = data.name;
    const temperature = data.main.temp;
    const condition = data.weather[0].description;
    const localTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }); // adjust timezone if needed

    // Format report
    const report = `
🌍 Weather Report for ${cityName}
🌡️ Temperature: ${temperature}°C
☁️ Condition: ${condition}
🕒 Reported Time: ${localTime}
    `;

    console.log(report);

    // Log request/response
    logToFile({ url, response: data });

    // Send to Slack
    await sendToSlack(report);

  } catch (error) {
    console.error("Error fetching weather:", error.message);
  }
}

function logToFile(content) {
  const logDir = "logs";
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logFile = `${logDir}/weather.log`;
  const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(content)}\n`;

  fs.appendFileSync(logFile, logEntry, "utf8");
}

async function sendToSlack(message) {
  try {
    await axios.post(SLACK_WEBHOOK_URL, { text: message });
    console.log("✅ Sent to Slack");
  } catch (error) {
    console.error("Error sending to Slack:", error.message);
  }
}

// Run script
fetchWeather();
