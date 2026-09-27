const SHEET_ID = "1kmLp6qs9sTmF2f0j6RzHPVfxZK7H97Hf04rseUEd6NE";

function doGet(e) {
  return jsonResponse({
    ok: true,
    message: "Backend Torneo Mus Gents & Lords activo"
  });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === "getData") return getData();
  if (action === "saveMatch") return saveMatch(body);
  if (action === "savePlayer") return savePlayer(body);
  if (action === "addLog") return addLog(body);

  return jsonResponse({ ok: false, error: "Acción no reconocida" });
}

function getData() {
  return jsonResponse({
    ok: true,
    players: sheetToObjects("players"),
    matches: sheetToObjects("matches"),
    logs: sheetToObjects("logs"),
    history: sheetToObjects("history"),
    venues: sheetToObjects("venues"),
    seasons: sheetToObjects("seasons")
  });
}


function saveMatch(body) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("matches");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("id");
  const seasonIdCol = headers.indexOf("seasonId");

  if (idCol === -1 || seasonIdCol === -1) {
    return jsonResponse({ ok: false, error: "La hoja matches necesita las columnas id y seasonId" });
  }
  if (body.id === undefined || body.id === "" || body.seasonId === undefined || body.seasonId === "") {
    return jsonResponse({ ok: false, error: "saveMatch requiere id y seasonId" });
  }

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(body.id) &&
        String(rows[i][seasonIdCol]) === String(body.seasonId)) {
      rowIndex = i + 1;
      break;
    }
  }

  const values = headers.map(h => body[h] ?? "");

  if (rowIndex === -1) {
    sheet.appendRow(values);
  } else {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([values]);
  }

  addLog({
    user: body.updatedBy || "unknown",
    action: "saveMatch",
    details: JSON.stringify(body)
  });

  return jsonResponse({ ok: true });
}

function savePlayer(body) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("players");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("id");

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(body.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  const values = headers.map(h => body[h] ?? "");

  if (rowIndex === -1) {
    sheet.appendRow(values);
  } else {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([values]);
  }

  addLog({
    user: body.name || "unknown",
    action: "savePlayer",
    details: JSON.stringify(body)
  });

  return jsonResponse({ ok: true });
}

function addLog(body) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("logs");
  sheet.appendRow([
    new Date(),
    body.user || "",
    body.action || "",
    body.details || ""
  ]);

  return jsonResponse({ ok: true });
}

function sheetToObjects(sheetName) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
  // Las hojas opcionales no deben tumbar todo getData si se eliminan.
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();

  if (rows.length < 2) return [];

  const headers = rows[0];

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}