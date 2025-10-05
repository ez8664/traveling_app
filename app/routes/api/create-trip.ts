import { GoogleGenerativeAI } from "@google/generative-ai";
import { ID } from "appwrite";
import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { appwriteConfig, database } from "~/appwrite/client";
import { parseMarkdownToJson } from "~/lib/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST to create trips." }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
    });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        // Validate request body
        const body = await request.json();
        const {
            country,
            numberOfDays,
            travelStyle,
            interest,
            budget,
            groupType,
            userId,
        } = body;

        // Validate required fields
        if (!country || !numberOfDays || !travelStyle || !interest || !budget || !groupType || !userId) {
            return new Response(JSON.stringify({ 
                error: "Missing required fields",
                required: ["country", "numberOfDays", "travelStyle", "interest", "budget", "groupType", "userId"]
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Validate environment variables
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable is not set");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!process.env.UNSPLASH_ACCESS_KEY) {
            console.error("UNSPLASH_ACCESS_KEY environment variable is not set");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;

        const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
        Budget: '${budget}'
        Interests: '${interest}'
        TravelStyle: '${travelStyle}'
        GroupType: '${groupType}'
        Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
        {
        "name": "A descriptive title for the trip",
        "description": "A brief description of the trip and its highlights not exceeding 100 words",
        "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
        "duration": ${numberOfDays},
        "budget": "${budget}",
        "travelStyle": "${travelStyle}",
        "country": "${country}",
        "interests": ${interest},
        "groupType": "${groupType}",
        "bestTimeToVisit": [
        '🌸 Season (from month to month): reason to visit',
        '☀️ Season (from month to month): reason to visit',
        '🍁 Season (from month to month): reason to visit',
        '❄️ Season (from month to month): reason to visit'
        ],
        "weatherInfo": [
        '☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)'
        ],
        "location": {
        "city": "name of the city or region",
        "coordinates": [latitude, longitude],
        "openStreetMap": "link to open street map"
        },
        "itinerary": [
        {
        "day": 1,
        "location": "City/Region Name",
        "activities": [
            {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
            {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
            {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
        ]
        },
        ...
        ]
        }`;

        console.log("Generating trip with Gemini...");
        const textResult = await genAI
            .getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
            .generateContent([prompt]);

        const responseText = textResult.response.text();
        console.log("Gemini response received, parsing...");
        
        const trip = parseMarkdownToJson(responseText);
        if (!trip) {
            console.error("Failed to parse Gemini response:", responseText);
            return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log("Fetching images from Unsplash...");
        const imageResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(country + ' ' + interest + ' ' + travelStyle)}&client_id=${unsplashApiKey}&per_page=3`
        );

        let imageUrls = [];
        if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageUrls = imageData.results?.slice(0, 3).map(
                (result: any) => result.urls?.regular || null
            ).filter(Boolean) || [];
        } else {
            console.warn("Failed to fetch images from Unsplash:", imageResponse.status);
            imageUrls = []; // Continue without images
        }

        console.log("Saving trip to database...");
        const result = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripsCollectionId,
            ID.unique(),
            {
                tripDetail: JSON.stringify(trip),
                createdAt: new Date().toISOString(),
                imageUrls,
                userId,
            }
        );

        console.log("Trip created successfully:", result.$id);
        return data({ id: result.$id, success: true });

    } catch (e) {
        console.error("Error generating trip:", e);
        return new Response(JSON.stringify({ 
            error: "Internal server error",
            details: e instanceof Error ? e.message : "Unknown error"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}