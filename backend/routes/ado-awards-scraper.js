import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import requireAuth from "../authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "ado-awards.json");

// POST endpoint to scrape and sync awards from Wikipedia
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const url = "https://en.wikipedia.org/wiki/Ado_(singer)";

    // Fetch Wikipedia page with proper headers
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

    // Parse awards from the HTML
    const awards = parseAwardsFromWikipedia(html);

    console.log(`Parsed ${awards.length} awards from Wikipedia`);

    if (awards.length === 0) {
      // Check if we can at least find the Awards heading
      const hasAwardsSection = html.includes('id="Awards"') ||
                             html.includes('>Awards</') ||
                             html.includes('id="Awards_and_nominations"');

      return res.status(404).json({
        error: "No awards found on Wikipedia page",
        message: hasAwardsSection
          ? "Found Awards section but could not parse the table"
          : "Could not find Awards section on the page",
        debug: {
          hasAwardsSection,
          htmlLength: html.length,
          hint: "The Wikipedia page structure may have changed"
        }
      });
    }

    // Load existing awards
    let existingAwards = [];
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      existingAwards = JSON.parse(raw);
    }

    // Merge awards - only add new ones that don't exist
    const mergedAwards = [...existingAwards];
    let addedCount = 0;

    for (const newAward of awards) {
      // Check if award already exists (by year, ceremony, category, and work)
      const exists = existingAwards.some(
        a => a.year === newAward.year &&
             a.ceremony === newAward.ceremony &&
             a.category === newAward.category &&
             a.work === newAward.work
      );

      if (!exists) {
        mergedAwards.push(newAward);
        addedCount++;
      }
    }

    // Sort by year descending
    mergedAwards.sort((a, b) => b.year - a.year);

    // Save merged awards
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(mergedAwards, null, 2));

    res.json({
      success: true,
      message: `Synced ${addedCount} new awards from Wikipedia`,
      totalAwards: mergedAwards.length,
      newAwards: addedCount
    });

  } catch (err) {
    console.error("Error syncing awards from Wikipedia:", err);
    res.status(500).json({
      error: "Failed to sync awards",
      message: err.message
    });
  }
});

// Parse awards from Wikipedia HTML
function parseAwardsFromWikipedia(html) {
  const awards = [];

  try {
    console.log("=== Starting Awards Wikipedia parse ===");
    console.log("Total HTML length:", html.length);

    // Check if Awards section exists (try multiple variations)
    const hasAwardsId = html.includes('id="Awards"');
    const hasAwardsNominationsId = html.includes('id="Awards_and_nominations"');

    console.log("Has Awards id:", hasAwardsId);
    console.log("Has Awards_and_nominations id:", hasAwardsNominationsId);

    if (!hasAwardsId && !hasAwardsNominationsId) {
      console.log("No Awards section found in HTML");
      return awards;
    }

    // Find Awards section - use the correct ID
    const searchId = hasAwardsNominationsId ? 'id="Awards_and_nominations"' : 'id="Awards"';
    const awardsIndex = html.indexOf(searchId);
    console.log("Awards index:", awardsIndex);

    if (awardsIndex === -1) {
      return awards;
    }

    // Extract a large chunk after the Awards heading to capture all tables
    const afterAwards = html.substring(awardsIndex);
    // Find the next major section (h2 with mw-headline)
    const nextSectionMatch = afterAwards.match(/<h2[^>]*>[\s\S]*?<span[^>]*class="mw-headline"[^>]*id="(?!Awards)[^"]+"/i);
    const nextSectionIndex = nextSectionMatch ? afterAwards.indexOf(nextSectionMatch[0]) : 50000;
    const awardsContent = afterAwards.substring(0, Math.min(nextSectionIndex, 50000));

    console.log("Awards content length:", awardsContent.length);

    // Find award tables (Wikipedia uses class="wikitable")
    const tableMatches = [...awardsContent.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi)];

    console.log(`Found ${tableMatches.length} award tables`);

    for (const tableMatch of tableMatches) {
      const tableContent = tableMatch[0]; // Get full table including opening tag

      // Extract table rows
      const rowMatches = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

      console.log(`Processing table with ${rowMatches.length} rows`);

      // Try to identify column structure from header
      let yearCol = -1, ceremonyCol = -1, categoryCol = -1, workCol = -1, resultCol = -1;

      if (rowMatches.length > 0) {
        const headerRow = rowMatches[0][1];
        const headerCells = [...headerRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];

        headerCells.forEach((cell, idx) => {
          const text = cell[1].replace(/<[^>]+>/g, '').toLowerCase().trim();
          console.log(`Header ${idx}: "${text}"`);

          if (text.includes('year')) yearCol = idx;
          else if (text.includes('ceremony') || text.includes('award')) ceremonyCol = idx;
          else if (text.includes('category')) categoryCol = idx;
          else if (text.includes('work') || text.includes('nominated') || text.includes('song')) workCol = idx;
          else if (text.includes('result') || text.includes('outcome')) resultCol = idx;
        });

        console.log(`Column mapping: year=${yearCol}, ceremony=${ceremonyCol}, category=${categoryCol}, work=${workCol}, result=${resultCol}`);
      }

      // Track rowspan values to carry forward
      const rowspanTracker = new Map(); // columnIndex -> {value, remainingRows}

      for (let i = 1; i < rowMatches.length; i++) { // Skip header row
        const rowContent = rowMatches[i][1];

        // Extract cells with their attributes to check for rowspan
        const cellMatches = [...rowContent.matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi)];

        // Build the complete row considering rowspans from previous rows
        const cells = [];
        let actualCellIndex = 0;

        for (let colIndex = 0; colIndex < 10; colIndex++) { // Max 10 columns
          // Check if this column is covered by a rowspan from a previous row
          if (rowspanTracker.has(colIndex)) {
            const tracker = rowspanTracker.get(colIndex);
            cells.push(tracker.value);
            tracker.remainingRows--;
            if (tracker.remainingRows <= 0) {
              rowspanTracker.delete(colIndex);
            }
          } else if (actualCellIndex < cellMatches.length) {
            // Use the actual cell from this row
            const cellMatch = cellMatches[actualCellIndex];
            const attributes = cellMatch[1];
            const content = cellMatch[2];

            const cellText = content
              .replace(/<[^>]+>/g, '') // Remove HTML tags
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&#95;/g, '_')
              .replace(/&quot;/g, '"')
              .replace(/&#91;/g, '[')
              .replace(/&#93;/g, ']')
              .replace(/\[\d+\]/g, '') // Remove reference markers
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();

            cells.push(cellText);

            // Check for rowspan attribute
            const rowspanMatch = attributes.match(/rowspan\s*=\s*["']?(\d+)/i);
            if (rowspanMatch) {
              const rowspan = parseInt(rowspanMatch[1]);
              if (rowspan > 1) {
                rowspanTracker.set(colIndex, {
                  value: cellText,
                  remainingRows: rowspan - 1
                });
              }
            }

            actualCellIndex++;
          } else {
            break;
          }
        }

        console.log(`Row ${i} cells:`, cells);

        // Use column mapping or fallback to positional
        let year, ceremony, category, work, result;

        if (yearCol >= 0 && ceremonyCol >= 0) {
          // Use detected columns
          year = yearCol < cells.length ? cells[yearCol] : '';
          ceremony = ceremonyCol < cells.length ? cells[ceremonyCol] : '';
          category = categoryCol >= 0 && categoryCol < cells.length ? cells[categoryCol] : '';
          work = workCol >= 0 && workCol < cells.length ? cells[workCol] : '';
          result = resultCol >= 0 && resultCol < cells.length ? cells[resultCol] : '';
        } else {
          // Fallback to positional (assume Year, Ceremony, Category, Work, Result)
          year = cells[0] || '';
          ceremony = cells[1] || '';
          category = cells[2] || '';
          work = cells.length > 3 ? cells[3] : '';
          result = cells.length > 4 ? cells[4] : '';
        }

        // Try to extract year if it's not in the first column
        if (!/\d{4}/.test(year)) {
          for (const cell of cells) {
            const yearMatch = cell.match(/\b(20\d{2})\b/);
            if (yearMatch) {
              year = yearMatch[1];
              break;
            }
          }
        }

        // Skip if year doesn't look valid
        if (!/\b20\d{2}\b/.test(year)) {
          console.log(`Row ${i}: Invalid year "${year}", skipping`);
          continue;
        }

        // Extract just the year number
        const yearMatch = year.match(/\b(20\d{2})\b/);
        const yearNum = yearMatch ? parseInt(yearMatch[1]) : 0;

        if (yearNum === 0) continue;

        // Determine if won
        const won = result.toLowerCase().includes('won') ||
                    result.toLowerCase().includes('winner') ||
                    rowContent.toLowerCase().includes('background:#');

        awards.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          year: yearNum,
          ceremony: ceremony || 'Unknown Ceremony',
          category: category || 'Unknown Category',
          work: work,
          result: result || (won ? 'Won' : 'Nominated'),
          won: won
        });

        console.log(`Added award: ${yearNum} - ${ceremony} - ${category}`);
      }
    }

  } catch (err) {
    console.error("Error parsing awards from Wikipedia:", err);
    console.error(err.stack);
  }

  console.log(`Total awards parsed: ${awards.length}`);
  return awards;
}

// Debug endpoint to check what sections exist
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

    // Find all section headings
    const headingMatches = [...html.matchAll(/<span[^>]*class="mw-headline"[^>]*id="([^"]*)"[^>]*>([^<]*)<\/span>/gi)];
    const sections = headingMatches.map(m => ({ id: m[1], text: m[2] }));

    // Look for tables in the Awards section
    const awardsIndex = html.indexOf('id="Awards"') || html.indexOf('id="Awards_and_nominations"');
    if (awardsIndex !== -1) {
      const afterAwards = html.substring(awardsIndex, awardsIndex + 5000);
      const tableMatches = [...afterAwards.matchAll(/<table[^>]*class="([^"]*)"[^>]*>/gi)];
      const tables = tableMatches.map(m => m[1]);

      return res.json({
        sections,
        awardsTableCount: tables.length,
        awardsTableClasses: tables,
        htmlLength: html.length
      });
    }

    res.json({
      sections,
      htmlLength: html.length,
      message: "No Awards section found"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
