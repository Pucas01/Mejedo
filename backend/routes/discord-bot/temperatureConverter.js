// Temperature conversion helper for Discord messages

// Regex patterns to match temperature mentions
const FAHRENHEIT_PATTERN = /\b(\d+(?:\.\d+)?)\s*°?\s*f(?:ahrenheit)?\b/gi;
const CELSIUS_PATTERN = /\b(\d+(?:\.\d+)?)\s*°?\s*c(?:elsius)?\b/gi;

/**
 * Convert Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius (rounded to 1 decimal)
 */
function fahrenheitToCelsius(fahrenheit) {
  return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
}

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit (rounded to 1 decimal)
 */
function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9 / 5 + 32) * 10) / 10;
}

/**
 * Register temperature conversion listener on Discord client
 * @param {Client} client - Discord.js client instance
 */
export function registerTemperatureConverter(client) {
  client.on('messageCreate', async (message) => {
    // Skip bot messages
    if (message.author.bot) return;

    // Skip DMs (optional - you can enable this for DMs if you want)
    if (!message.guild) return;

    const content = message.content;

    // Check for Fahrenheit mentions
    const fahrenheitMatches = [...content.matchAll(FAHRENHEIT_PATTERN)];
    if (fahrenheitMatches.length > 0) {
      const conversions = fahrenheitMatches.map(match => {
        const tempF = parseFloat(match[1]);
        const tempC = fahrenheitToCelsius(tempF);
        return `**${tempC}°C**`;
      });

      const response = `That's ${conversions.join(', ')} for the british people here...`;

      try {
        await message.reply(response);
      } catch (error) {
        console.error('Error sending Fahrenheit conversion:', error);
      }
      return; // Don't check for Celsius if we already found Fahrenheit
    }

    // Check for Celsius mentions
    const celsiusMatches = [...content.matchAll(CELSIUS_PATTERN)];
    if (celsiusMatches.length > 0) {
      const conversions = celsiusMatches.map(match => {
        const tempC = parseFloat(match[1]);
        const tempF = celsiusToFahrenheit(tempC);
        return `**${tempF}°F**`;
      });

      const response = `That's ${conversions.join(', ')} for our Americans`;

      try {
        await message.reply(response);
      } catch (error) {
        console.error('Error sending Celsius conversion:', error);
      }
    }
  });

  console.log('Temperature converter registered');
}
