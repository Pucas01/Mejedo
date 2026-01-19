import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import requireAuth from "../../authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "ado-tours.json");

router.post("/sync", requireAuth, async (req, res) => {
  try {
    const url = "https://en.wikipedia.org/wiki/Ado_(singer)";

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Wikipedia returned status ${response.status}`,
        message: "Unable to fetch Wikipedia page"
      });
    }

    const html = await response.text();

    const tours = parseToursFromWikipedia(html);

    console.log(`Parsed ${tours.length} tours from Wikipedia`);

    if (tours.length === 0) {
      const hasToursSection = html.includes('id="Tours"') ||
                             html.includes('>Tours</') ||
                             html.includes('id="Concert_tours"');

      return res.status(404).json({
        error: "No tours found on Wikipedia page",
        message: hasToursSection
          ? "Found Tours section but could not parse the table"
          : "Could not find Tours section on the page",
        debug: {
          hasToursSection,
          htmlLength: html.length,
          hint: "The Wikipedia page structure may have changed"
        }
      });
    }

    let existingTours = [];
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      existingTours = JSON.parse(raw);
    }

    const mergedTours = [...existingTours];
    let addedCount = 0;

    for (const newTour of tours) {
      const exists = existingTours.some(
        t => t.tourName === newTour.tourName && t.date === newTour.date
      );

      if (!exists) {
        mergedTours.push(newTour);
        addedCount++;
      }
    }

    mergedTours.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(mergedTours, null, 2));

    res.json({
      success: true,
      message: `Synced ${addedCount} new tours from Wikipedia`,
      totalTours: mergedTours.length,
      newTours: addedCount
    });

  } catch (err) {
    console.error("Error syncing tours from Wikipedia:", err);
    res.status(500).json({
      error: "Failed to sync tours",
      message: err.message
    });
  }
});

function parseToursFromWikipedia(html) {
  const tours = [];

  try {
    console.log("=== Starting Wikipedia parse ===");
    console.log("Total HTML length:", html.length);

    const hasToursId = html.includes('id="Tours"');
    const hasConcertToursId = html.includes('id="Concert_tours"');
    const hasToursHeading = html.includes('>Tours<');

    console.log("Has Tours id:", hasToursId);
    console.log("Has Concert_tours id:", hasConcertToursId);
    console.log("Has Tours heading text:", hasToursHeading);

    if (!hasToursId && !hasConcertToursId) {
      console.log("No Tours section found in HTML");

      const headings = [...html.matchAll(/<span[^>]*class="mw-headline"[^>]*id="([^"]*)"[^>]*>/gi)];
      console.log("Found sections:", headings.slice(0, 10).map(m => m[1]));

      return tours;
    }

    const searchId = hasToursId ? 'id="Tours"' : 'id="Concert_tours"';
    const toursIndex = html.indexOf(searchId);
    console.log("Tours index:", toursIndex);
    console.log("Search term:", searchId);

    if (toursIndex === -1) {
      return tours;
    }

    const contextStart = Math.max(0, toursIndex - 100);
    const contextEnd = Math.min(html.length, toursIndex + 2000);
    console.log("Context around Tours heading:");
    console.log(html.substring(contextStart, contextEnd));

    const afterTours = html.substring(toursIndex);
    const nextH2Match = afterTours.match(/<\/h2>([\s\S]*?)(?=<h2[^>]*>[\s\S]*?<span[^>]*class="mw-headline"|$)/i);

    if (!nextH2Match) {
      console.log("Could not extract content after Tours heading");
      console.log("First 1000 chars after Tours:", afterTours.substring(0, 1000));
      return tours;
    }

    const toursContent = nextH2Match[1];
    console.log("Tours content length:", toursContent.length);

    const parseTourList = (sectionName, isOneOff = false) => {
      const sectionIndex = toursContent.indexOf(sectionName);

      if (sectionIndex === -1) {
        console.log(`Could not find '${sectionName}' section`);
        return;
      }

      console.log(`Found '${sectionName}' at index:`, sectionIndex);

      const afterSection = toursContent.substring(sectionIndex);
      const listMatch = afterSection.match(/<ul>([\s\S]*?)<\/ul>/i);

      if (!listMatch) {
        console.log(`Could not find list after '${sectionName}'`);
        return;
      }

      const listContent = listMatch[1];
      console.log(`Found ${sectionName} list, length:`, listContent.length);

      const listItemMatches = listContent.matchAll(/<li>([\s\S]*?)<\/li>/gi);

      for (const itemMatch of listItemMatches) {
        let itemText = itemMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#95;/g, '_')
          .replace(/&#91;/g, '[')
          .replace(/&#93;/g, ']')
          .replace(/\[\d+\]/g, '')
          .trim();

        console.log("Processing item:", itemText);

        const match = itemText.match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (!match) {
          console.log("Could not parse format:", itemText);
          continue;
        }

        const tourName = match[1].trim();
        const dateInfo = match[2].trim();

        console.log("Name:", tourName, "Date info:", dateInfo);

        const yearMatches = dateInfo.match(/\b(20\d{2})/g);

        if (!yearMatches || yearMatches.length === 0) {
          console.log("No years found in:", dateInfo);
          continue;
        }

        let date = '';
        if (isOneOff) {
          const specificDateMatch = dateInfo.match(/([A-Za-z]+)\s+(\d{1,2})(?:–\d{1,2})?,?\s+(20\d{2})/);
          if (specificDateMatch) {
            const monthMap = {
              'january': '01', 'february': '02', 'march': '03', 'april': '04',
              'may': '05', 'june': '06', 'july': '07', 'august': '08',
              'september': '09', 'october': '10', 'november': '11', 'december': '12'
            };
            const month = monthMap[specificDateMatch[1].toLowerCase()];
            const day = specificDateMatch[2].padStart(2, '0');
            const year = specificDateMatch[3];
            if (month) {
              date = `${year}-${month}-${day}`;
            }
          }
        }

        if (!date) {
          date = `${yearMatches[0]}-01-01`;
        }

        const isMultiYear = yearMatches.length > 1;
        let notes = isMultiYear
          ? `Tour ran from ${yearMatches[0]} to ${yearMatches[yearMatches.length - 1]}`
          : dateInfo.includes('upcoming')
            ? 'Upcoming tour'
            : '';

        if (isOneOff) {
          notes = notes ? `${notes} - One-off performance` : 'One-off performance';
        }

        tours.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          tourName: tourName,
          date: date,
          venue: "",
          location: "",
          notes: notes
        });

        console.log("Added:", tourName);
      }
    };

    parseTourList("One-off performances", true);

    parseTourList("Concert tours", false);

  } catch (err) {
    console.error("Error parsing Wikipedia HTML:", err);
  }

  return tours;
}

router.get("/debug", requireAuth, async (req, res) => {
  try {
    const url = "https://en.wikipedia.org/wiki/Ado_(singer)";

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Wikipedia returned status ${response.status}`
      });
    }

    const html = await response.text();

    const headingMatches = [...html.matchAll(/<span[^>]*class="mw-headline"[^>]*id="([^"]*)"[^>]*>([^<]*)<\/span>/gi)];
    const sections = headingMatches.map(m => ({ id: m[1], text: m[2] }));

    const tableMatches = [...html.matchAll(/<table[^>]*class="([^"]*)"[^>]*>/gi)];
    const tables = tableMatches.map(m => m[1]);

    res.json({
      sections,
      tableCount: tables.length,
      tableClasses: tables,
      htmlLength: html.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
