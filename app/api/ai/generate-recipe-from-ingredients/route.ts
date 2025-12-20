import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyToken } from "@/lib/jwt";
import AchievementService from '@/services/achievement.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if a URL is a collector/aggregator page (not a direct recipe)
function isCollectorPage(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // Patterns that indicate collector pages
  const collectorPatterns = [
    /\/recipes\//,           // /recipes/ (list pages)
    /\/recipe-collection/i,
    /\/recipe-list/i,
    /\/all-recipes/i,
    /\/browse/i,
    /\/search/i,
    /\/category/i,
    /\/tag\//i,
    /\/collection/i,
    /\/gallery/i,
    /\/roundup/i,
    /\/best-/i,
    /\/top-/i,
    /\/easy-recipes/i,
    /\/quick-recipes/i,
    /\/category\//i,
    /\/tag\//i,
    /\?page=/i,              // Pagination
    /\?category=/i,
    /\?tag=/i,
    /\?search=/i,
    /\/recipes$/i,           // Ends with /recipes
    /\/recipes\/$/i,         // Ends with /recipes/
  ];
  
  // Check if URL matches collector patterns
  for (const pattern of collectorPatterns) {
    if (pattern.test(urlLower)) {
      return true;
    }
  }
  
  // Check for specific domain patterns
  const domainCollectorPatterns = [
    /allrecipes\.com\/recipes\//,  // AllRecipes list pages
    /foodnetwork\.com\/recipes\//, // Food Network list pages
    /bbcgoodfood\.com\/recipes\//, // BBC Good Food list pages
  ];
  
  for (const pattern of domainCollectorPatterns) {
    if (pattern.test(urlLower) && !/\/recipes\/\d+\//.test(urlLower)) {
      // Allow if it's a specific recipe ID pattern
      return true;
    }
  }
  
  return false;
}

// Web search function using Tavily API
async function searchWeb(query: string): Promise<string[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    // Fallback to DuckDuckGo or return empty
    console.warn("Tavily API key not configured, skipping web search");
    return [];
  }

  try {
    // Search for specific recipe pages (not collections)
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: `${query} recipe how to make`,
        search_depth: "advanced", // Use advanced to get better results
        include_answer: false,
        include_domains: [
          "allrecipes.com",
          "foodnetwork.com",
          "bbcgoodfood.com",
          "tasty.co",
          "bonappetit.com",
          "seriouseats.com",
          "food52.com",
          "thespruceeats.com",
          "simplyrecipes.com",
          "delish.com",
          "tasteofhome.com",
          "eatingwell.com",
        ],
        max_results: 10, // Get more results to filter collector pages
      }),
    });

    if (!response.ok) {
      console.error("Tavily API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    
    // Score and filter results to find the best single recipe link
    const scoredResults = results
      .map((result: any) => {
        const url = result.url;
        if (!url) return null;
        
        // Skip collector pages based on URL
        if (isCollectorPage(url)) return null;
        
        const title = (result.title || "").toLowerCase();
        const content = (result.content || "").toLowerCase();
        
        // Check for collector keywords in title/content
        const collectorKeywords = [
          "collection",
          "roundup",
          "best recipes",
          "top recipes",
          "easy recipes",
          "quick recipes",
          "recipe ideas",
          "recipe list",
          "all recipes",
          "browse recipes",
          "recipe gallery",
          "more recipes",
          "similar recipes",
        ];
        
        const hasCollectorKeyword = collectorKeywords.some(
          (keyword) => title.includes(keyword) || content.includes(keyword)
        );
        
        if (hasCollectorKeyword) return null;
        
        // Score based on recipe indicators (higher score = better match)
        let score = 0;
        const recipeIndicators = [
          "ingredients",
          "instructions",
          "directions",
          "prep time",
          "cook time",
          "servings",
          "nutrition",
          "calories",
          "cooking time",
          "preparation",
        ];
        
        recipeIndicators.forEach((indicator) => {
          if (content.includes(indicator)) score += 1;
        });
        
        // Prefer URLs that look like direct recipe pages
        // Pattern: /recipe/ or /recipes/ followed by a slug or ID
        if (/\/recipe[s]?\/[^\/]+/.test(url.toLowerCase())) {
          score += 5;
        }
        
        // Prefer known recipe domains
        const knownRecipeDomains = [
          "allrecipes.com",
          "foodnetwork.com",
          "bbcgoodfood.com",
          "bonappetit.com",
          "seriouseats.com",
          "simplyrecipes.com",
        ];
        
        if (knownRecipeDomains.some((domain) => url.includes(domain))) {
          score += 2;
        }
        
        // Must have at least some recipe indicators to be considered
        if (score === 0) return null;
        
        return { url, score, result };
      })
      .filter((item: any) => item !== null)
      .sort((a: any, b: any) => b.score - a.score); // Sort by score descending
    
    // Return only the best single recipe link
    if (scoredResults.length === 0) {
      return [];
    }
    
    return [scoredResults[0].url];
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      ),
      user: null,
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      ),
      user: null,
    };
  }

  return { error: null, user: payload };
}

// POST /api/ai/generate-recipe-from-ingredients - Generate recipe using OpenAI from ingredients list
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { ingredients, useRealRecipe = true } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Ingredients array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Create a search query from ingredients for web search
    const ingredientsQuery = ingredients.join(", ");
    const searchLinks = useRealRecipe ? await searchWeb(ingredientsQuery) : [];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a world-class culinary recipe generator. Create a complete, original recipe based on the provided ingredients.

Return your response as a JSON object with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description",
  "type": "breakfast|lunch|dinner|snack|drink",
  "time": "Estimated time (e.g., '30 min')",
  "kcal": "Estimated calories (e.g., '350 kcal')",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": ["step 1", "step 2", ...],
  "links": [] // ALWAYS return empty array - links will be added from web search if applicable
}

Focus on generating a complete, original, detailed recipe using the provided ingredients. You may suggest additional common ingredients (like salt, pepper, oil) if needed, but prioritize using the provided ingredients. Do NOT include any links in the response.`,
        },
        {
          role: "user",
          content: `Create a recipe using these ingredients: ${ingredients.join(", ")}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate recipe" },
        { status: 500 }
      );
    }

    let recipeData;
    try {
      recipeData = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Validate links - filter out suspicious patterns
    const validateLink = (link: string): boolean => {
      if (!link || typeof link !== "string") return false;
      if (!link.startsWith("http://") && !link.startsWith("https://"))
        return false;

      // Filter out common fake/placeholder patterns
      const suspiciousPatterns = [
        /example\.com/i,
        /test\.com/i,
        /placeholder/i,
        /fake/i,
        /dummy/i,
        /localhost/i,
        /127\.0\.0\.1/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(link)) return false;
      }

      try {
        const url = new URL(link);
        const hostname = url.hostname.toLowerCase();

        // Filter out obvious fake domains
        const blockedPatterns = [
          /example/i,
          /test/i,
          /placeholder/i,
          /fake/i,
          /dummy/i,
          /localhost/i,
        ];

        for (const pattern of blockedPatterns) {
          if (pattern.test(hostname)) return false;
        }

        const knownRecipeDomains = [
          // --- Major Publications & Professional Kitchens ---
          "allrecipes.com",
          "foodnetwork.com",
          "bbcgoodfood.com",
          "bonappetit.com",
          "seriouseats.com",
          "epicurious.com",
          "cookinglight.com",
          "foodandwine.com",
          "marthastewart.com",
          "myrecipes.com",
          "tasteofhome.com",
          "eatingwell.com",
          "delish.com",
          "simplyrecipes.com",
          "thekitchn.com",
          "thespruceeats.com",
          "food52.com",
          "nytimes.com/cooking", // NYT Cooking (keep subdomain/path if checking for exact matches)
          "nytimes.com", // Catch the main domain too
          "saveur.com",
          "finedininglovers.com",
        
          // --- Influential Food Blogs & Niche Sites ---
          "smittenkitchen.com",
          "pinchofyum.com",
          "ambitiouskitchen.com",
          "budgetbytes.com",
          "halfbakedharvest.com",
          "minimalistbaker.com",
          "damndelicious.net",
          "loveandlemons.com",
          "natashaskitchen.com",
          "gimmesomeoven.com",
          "sallysbakingaddiction.com",
          "twopeasandtheirpod.com",
          "thepioneerwoman.com",
          "therheaclinic.com",
          "thecozycook.com",
          "spendwithpennies.com",
          "browneyedbaker.com",
          "foodwishes.com",
          "aspicyperspective.com",
          "averiecooks.com",
          "simplyhappyfoodie.com",
          "skinnytaste.com",
          "inspiredtaste.net",
          "davidlebovitz.com",
          "closetcooking.com",
          "mydarlingvegan.com",
          "ohsheglows.com",
          "thewoksoflife.com",
          "recipetineats.com",
          "joyofbaking.com",
        
          // --- Social Platforms (Keep these in if you intend to allow them) ---
          "tasty.co",
          "pinterest.com",
          "youtube.com",
          "instagram.com",
          "tiktok.com",
        ];

        // If it's a known domain, allow it
        if (
          knownRecipeDomains.some(
            (domain) => hostname === domain || hostname.endsWith("." + domain)
          )
        ) {
          return true;
        }

        // For unknown domains, check if they look like recipe/cooking sites
        const cookingKeywords = [
          "recipe",
          "cook",
          "food",
          "kitchen",
          "cuisine",
          "meal",
          "dish",
        ];
        const hasCookingKeyword = cookingKeywords.some((keyword) =>
          hostname.includes(keyword)
        );

        // Allow if it has cooking-related keywords, otherwise be conservative
        return hasCookingKeyword;
      } catch {
        // Invalid URL format
        return false;
      }
    };

    // Use only the web search result (single direct recipe link)
    // Ignore AI-generated links since we want only verified web search results
    const finalLinks = searchLinks
      .filter(validateLink)
      .slice(0, 1); // Only one recipe link

    // Validate and normalize the response
    const normalizedRecipe = {
      title: recipeData.title || "Untitled Recipe",
      description: recipeData.description || "",
      type: ["breakfast", "lunch", "dinner", "snack", "drink"].includes(
        recipeData.type?.toLowerCase()
      )
        ? recipeData.type.toLowerCase()
        : "dinner",
      time: recipeData.time || "30 min",
      kcal: recipeData.kcal || "300 kcal",
      ingredients: Array.isArray(recipeData.ingredients)
        ? recipeData.ingredients
        : [],
      steps: Array.isArray(recipeData.steps) ? recipeData.steps : [],
      links: finalLinks,
      picture: {
        type: "emoji",
        value: "🍽️",
      },
    };

    // Track achievement (async, don't wait for it)
    AchievementService.trackAndCheck(auth.user!.userId, 'ai_recipes_generated').catch(err => 
      console.error('Achievement tracking error:', err)
    );

    return NextResponse.json({
      success: true,
      recipe: normalizedRecipe,
    });
  } catch (error: any) {
    console.error("AI recipe generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
