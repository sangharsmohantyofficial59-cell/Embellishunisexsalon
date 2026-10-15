# Embellish Unisex Salon: 3D scroll concept site

Design concept by Sanghars Mohanty. Not the salon's official site.

## Open in VS Code
1. File > Open Folder > this folder.
2. Install the "Live Server" extension (VS Code will suggest it), then right-click `index.html` > Open with Live Server.
   Double-clicking `index.html` also works. No build step, no npm, no libraries.

## Structure
```
index.html          page content (hero, services, reviews, visit)
css/styles.css      all styling; colours and fonts are variables at the top
js/strands.js       3D light strands (raw WebGL), time-of-day clock, services drum, flying reviews
js/media.js         loads your photos/video; shows a placeholder if a file is missing
assets/images/      PUT PHOTOS HERE (names below)
assets/video/       PUT hero.mp4 HERE (optional)
```

## Photos to add (the one manual step)
I could not download photos from Google Maps from my workspace. Please save them yourself,
ideally from the salon's own Instagram or with the owner's permission, and name them:

| File | Used for | Best size |
|---|---|---|
| assets/images/hair.jpg | Hair arch | 800x1000, portrait |
| assets/images/skin.jpg | Skin arch | 800x1000, portrait |
| assets/images/nails.jpg | Nails and lashes arch | 800x1000, portrait |
| assets/images/makeup.jpg | Makeup and bridal arch | 800x1000, portrait |
| assets/images/grooming.jpg | Grooming arch | 800x1000, portrait |
| assets/images/storefront.jpg | Visit section | 1200x800, landscape |
| assets/images/hero.jpg | Poster for the hero video (optional) | 1920x1080 |
| assets/video/hero.mp4 | Ambient hero video, muted loop (optional, under 8 MB) | 1280x720 |

Until a file exists, its spot shows a quiet placeholder with the file name. Keep photos under about 300 KB each (squoosh.app).
Photos are tinted automatically to the time-of-day colour so they blend in.

## Things to edit by hand
- Copy and services: `index.html` (each service is one `.svc` block).
- WhatsApp number: search `919777039081` (it appears in several links).
- Colours/fonts: top of `css/styles.css` (`--rose`, `--pearl`, `--display`, `--body`).
- Strand count/speed: `js/strands.js` (`var N = ...`, `M`, camera section in `update()`).
- Prices and Instagram: add once the salon shares them. Do not invent them.
- When pitching as official, remove the "Design concept" note (`.concept` in index.html) and the footer disclaimer only with the salon's consent.

## Deploy
Drag the folder onto vercel.com/new, or `vercel` in this folder. It is a static site.
