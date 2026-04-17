# Firestore Database Documentation

## Collection: `water-records`

All water usage records are stored in the **`water-records`** top-level collection.  
Each document in this collection represents a single reading of the water meter.

---

## Document Fields

| Field | Type | Format / Range | Description |
|---|---|---|---|
| `date` | `string` | `YYYY-MM-DD` | Date of the reading (e.g. `"2026-04-17"`) |
| `time` | `string` | `HH:mm` (24-hour) | Time of the reading (e.g. `"07:30"`) |
| `cubicMeter` | `number` | `≥ 0`, up to 3 decimal places | Water usage in cubic metres (e.g. `1.500`) |
| `liter` | `number` | `≥ 0` | Water usage in litres — **always equal to `cubicMeter × 1000`** (e.g. `1500`) |
| `createdAt` | `Timestamp` | Firestore Server Timestamp | Auto-generated timestamp when the document is created — **do not set this manually** |

> **Note:** `liter` and `cubicMeter` are automatically synchronised by the app UI.  
> You only need to supply one value; the other is filled in for you.  
> If you insert documents directly into Firestore, ensure `liter = cubicMeter × 1000`.

---

## Example Document

```json
{
  "date": "2026-04-17",
  "time": "07:30",
  "cubicMeter": 1.5,
  "liter": 1500,
  "createdAt": "<Firestore Server Timestamp>"
}
```

---

## Firestore Security Rules (Recommended)

Add the following rules in the **Firestore → Rules** tab of your Firebase Console to allow
read/write access while preventing invalid data from being stored:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /water-records/{recordId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasAll(['date','time','cubicMeter','liter','createdAt']) &&
        request.resource.data.date is string &&
        request.resource.data.time is string &&
        request.resource.data.cubicMeter is number && request.resource.data.cubicMeter >= 0 &&
        request.resource.data.liter    is number && request.resource.data.liter    >= 0;
    }
  }
}
```

> For production you should also add authentication rules so only signed-in users can write.

---

## Required Firestore Index

The app queries `water-records` ordered by `createdAt` (descending).  
Firestore will create this single-field index automatically on first query.  
No composite index is needed.

---

## How Data is Written by the App

The app uses `addDoc` from the Firebase JS SDK:

```ts
await addDoc(collection(db, "water-records"), {
  date,          // string "YYYY-MM-DD"
  time,          // string "HH:mm"
  cubicMeter,    // number
  liter,         // number (= cubicMeter * 1000)
  createdAt: serverTimestamp(),
});
```

The document ID is **auto-generated** by Firestore — you do not need to provide one.
