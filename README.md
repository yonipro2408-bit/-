# מה יש באזור? (אב-טיפוס)

- `index.html` - האפליקציה (לוגו ואייקונים משובצים בתוכה).
- `netlify/functions/api.js` - שרת קטן שמביא מקומות מ-OpenStreetMap בצד השרת.
- `netlify.toml` - הגדרות.

## בדיקת תקינות
אחרי פריסה פתח בדפדפן (החלף את הכתובת באתר שלך):
`/.netlify/functions/api?type=places&lat=32.93&lon=35.08&cat=food&r=3`
אם רואים JSON ארוך עם `elements` - הנתונים עובדים. אם רואים `error` - שלח את הטקסט.
