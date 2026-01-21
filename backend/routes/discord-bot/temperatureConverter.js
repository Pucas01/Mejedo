
const FAHRENHEIT_PATTERN = /\b(\d+(?:\.\d+)?)\s*°?\s*f(?:ahrenheit)?\b/gi;
const CELSIUS_PATTERN = /\b(\d+(?:\.\d+)?)\s*°?\s*c(?:elsius)?\b/gi;

function fahrenheitToCelsius(fahrenheit) {
  return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
}

function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9 / 5 + 32) * 10) / 10;
}

export function registerTemperatureConverter(client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.guild) return;

    const content = message.content;

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
      return;
    }

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
