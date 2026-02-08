import { ID } from "react-native-appwrite";
import { config, database } from "./appwite";
import {
  agentImages,
  galleryImages,
  propertiesImages,
  reviewImages,
} from "./data";

const COLLECTIONS = {
  AGENT: config.agentsCollectionId,
  REVIEWS: config.reviewsCollectionId,
  GALLERY: config.galleriesCollectionId,
  PROPERTY: config.propertiesCollectionId,
};

const propertyTypes = [
  "House",
  "Townhouse",
  "Condo",
  "Duplex",
  "Studio",
  "Villa",
  "Apartment",
  "Other",
];

const facilities = ["Laundry", "Parking", "Gym", "wifi", "Pet-friendly"];

function getRandomSubset<T>(
  array: T[],
  minItems: number,
  maxItems: number,
): T[] {
  if (minItems > maxItems) {
    throw new Error("minItems cannot be greater than maxItems");
  }
  if (minItems < 0 || maxItems > array.length) {
    throw new Error(
      "minItems or maxItems are out of valid range for the array",
    );
  }

  // Generate a random size for the subset within the range [minItems, maxItems]
  const subsetSize =
    Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

  // Create a copy of the array to avoid modifying the original
  const arrayCopy = [...array];

  // Shuffle the array copy using Fisher-Yates algorithm
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[randomIndex]] = [
      arrayCopy[randomIndex],
      arrayCopy[i],
    ];
  }

  // Return the first `subsetSize` elements of the shuffled array
  return arrayCopy.slice(0, subsetSize);
}

async function seed() {
  try {
    // Clear existing data from all collections
    for (const key in COLLECTIONS) {
      const collectionId = COLLECTIONS[key as keyof typeof COLLECTIONS];
      const documents = await database.listDocuments(
        config.databaseId!,
        collectionId!,
      );
      for (const doc of documents.documents) {
        await database.deleteDocument(
          config.databaseId!,
          collectionId!,
          doc.$id,
        );
      }
    }

    console.log("Cleared all existing data.");

    // Seed Agents
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      const agent = await database.createDocument(
        config.databaseId!,
        COLLECTIONS.AGENT!,
        ID.unique(),
        {
          name: `Agent ${i}`,
          email: `agent${i}@example.com`,
          avatar: agentImages[Math.floor(Math.random() * agentImages.length)],
        },
      );
      agents.push(agent);
    }
    console.log(`Seeded ${agents.length} agents.`);

    // Reviews will be created per property (no need for generic reviews)
    const reviews: any[] = [];

    // Seed Galleries
    const galleries = [];
    for (const image of galleryImages) {
      const gallery = await database.createDocument(
        config.databaseId!,
        COLLECTIONS.GALLERY!,
        ID.unique(),
        { image },
      );
      galleries.push(gallery);
    }

    console.log(`Seeded ${galleries.length} galleries.`);

    // Seed Properties with Reviews
    const propertyGalleryMap: { [key: string]: any[] } = {};

    for (let i = 1; i <= 20; i++) {
      const assignedAgent = agents[Math.floor(Math.random() * agents.length)];
      const assignedGalleries = getRandomSubset(galleries, 3, 5);

      const selectedFacilities = facilities
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * facilities.length) + 1);

      const image =
        propertiesImages.length - 1 >= i
          ? propertiesImages[i]
          : propertiesImages[
              Math.floor(Math.random() * propertiesImages.length)
            ];

      const property = await database.createDocument(
        config.databaseId!,
        COLLECTIONS.PROPERTY!,
        ID.unique(),
        {
          name: `Property ${i}`,
          properties:
            propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
          description: `This is the description for Property ${i}.`,
          address: `123 Property Street, City ${i}`,
          geolocation: `192.168.1.${i}, 192.168.1.${i}`,
          price: Math.floor(Math.random() * 9000) + 1000,
          area: Math.floor(Math.random() * 3000) + 500,
          bedrooms: Math.floor(Math.random() * 5) + 1,
          bathrooms: Math.floor(Math.random() * 5) + 1,
          rating: Math.floor(Math.random() * 5) + 1,
          facillites: selectedFacilities,
          image: image,
          agent: assignedAgent.$id,
        },
      );

      propertyGalleryMap[property.$id] = assignedGalleries;

      // Seed 5-7 reviews for each property
      const reviewCount = Math.floor(Math.random() * 3) + 5; // 5-7 reviews
      const propertyReviewIds: string[] = [];

      const sampleReviews = [
        "Amazing property! Loved the location and amenities.",
        "Great place to live. Would definitely recommend.",
        "The property exceeded my expectations. Highly satisfied!",
        "Perfect home for my family. Excellent condition.",
        "Wonderful experience. The agent was very helpful.",
        "Beautiful design and great neighborhood.",
        "Very comfortable and well-maintained property.",
        "Fantastic investment. Great return potential.",
        "Absolutely love it here. Can't ask for better!",
        "Highly recommended. Best decision ever made.",
        "Top-notch property with excellent features.",
        "Exceeded all expectations. Worth every penny.",
        "Great community and friendly atmosphere.",
        "Professional service and quality property.",
        "Couldn't be happier with my choice.",
      ];

      for (let j = 0; j < reviewCount; j++) {
        const randomReviewText =
          sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
        const review = await database.createDocument(
          config.databaseId!,
          COLLECTIONS.REVIEWS!,
          ID.unique(),
          {
            name: `Reviewer ${Math.floor(Math.random() * 100) + 1}`,
            avatar:
              reviewImages[Math.floor(Math.random() * reviewImages.length)],
            review: randomReviewText,
            rating: Math.floor(Math.random() * 5) + 1,
            property: property.$id, // Link review to property
          },
        );
        propertyReviewIds.push(review.$id);
        reviews.push(review);
      }

      console.log(
        `Seeded property: ${property.name} with ${propertyReviewIds.length} reviews and ${assignedGalleries.length} galleries`,
      );
    }

    console.log(
      `Seeded ${reviews.length} total reviews across all properties.`,
    );

    console.log("Data seeding completed.");
    return true;
  } catch (error: any) {
    console.error("Error seeding data:", error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error response:", error?.response);
    throw error;
  }
}

export default seed;
