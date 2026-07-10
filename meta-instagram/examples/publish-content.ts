/**
 * Beispiel: Content automatisch veröffentlichen
 * Bild, Karussell und Reel auf Instagram posten
 */

import { createMetaSDK } from "../src/index.js";

const sdk = createMetaSDK({
  accessToken: process.env.META_ACCESS_TOKEN!,
  apiVersion: "v21.0",
});

const IG_USER_ID = process.env.IG_USER_ID!;

async function publishSingleImage() {
  console.log("📸 Veröffentliche einzelnes Bild...");

  const result = await sdk.instagram.publishImage(IG_USER_ID, {
    imageUrl: "https://example.com/mein-design.jpg", // öffentlich erreichbare URL
    caption: `Neues Design von BabicA Designs! ✨

Frisches Branding für ein lokales Unternehmen aus Wien.

#babicadesigns #logodesign #branding #wien #graphicdesign #smallbusiness`,
    altText: "Logo-Design in Blau und Gold für ein Wiener Unternehmen",
  });

  console.log(`   ✅ Veröffentlicht! Media-ID: ${result.id}`);
  return result;
}

async function publishCarousel() {
  console.log("🎠 Veröffentliche Karussell-Post...");

  // Schritt 1: Einzelne Bilder als Container erstellen
  const [img1, img2, img3] = await Promise.all([
    sdk.instagram.createImageContainer(IG_USER_ID, {
      imageUrl: "https://example.com/slide1.jpg",
    }),
    sdk.instagram.createImageContainer(IG_USER_ID, {
      imageUrl: "https://example.com/slide2.jpg",
    }),
    sdk.instagram.createImageContainer(IG_USER_ID, {
      imageUrl: "https://example.com/slide3.jpg",
    }),
  ]);

  // Schritt 2: Auf FINISHED warten
  await Promise.all([
    sdk.instagram.waitForContainer(img1.id),
    sdk.instagram.waitForContainer(img2.id),
    sdk.instagram.waitForContainer(img3.id),
  ]);

  // Schritt 3: Karussell-Container erstellen
  const carousel = await sdk.instagram.createCarouselContainer(IG_USER_ID, {
    children: [img1.id, img2.id, img3.id],
    caption: `Vorher / Nachher — Branding-Transformation 🔄

Slide 1: Alter Look
Slide 2: Neue Identität
Slide 3: Anwendungsbeispiele

#rebranding #babicadesigns #branding #designprozess`,
  });

  // Schritt 4: Veröffentlichen
  const result = await sdk.instagram.publishMedia(IG_USER_ID, carousel.id);
  console.log(`   ✅ Karussell veröffentlicht! Media-ID: ${result.id}`);
  return result;
}

async function publishReel() {
  console.log("🎬 Veröffentliche Reel...");

  const result = await sdk.instagram.publishReel(IG_USER_ID, {
    videoUrl: "https://example.com/prozess-video.mp4",
    caption: `Design-Prozess in 30 Sekunden ⚡

Von der Idee zum fertigen Logo.

#designprocess #logodesign #babicadesigns #behindthescenes`,
    shareToFeed: true,
  });

  console.log(`   ✅ Reel veröffentlicht! Media-ID: ${result.id}`);
  return result;
}

async function main() {
  console.log("=== Content Publishing — BabicA Designs ===\n");

  // Nur eine Funktion auskommentieren und ausführen:
  await publishSingleImage();
  // await publishCarousel();
  // await publishReel();
}

main().catch(console.error);
