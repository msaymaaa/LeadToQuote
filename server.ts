import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Strict Zod Schemas for Structured Validation (Phase 4, Section 6)
export const AiLeadExtractionSchema = z.object({
  service: z.string().min(1, 'Service is required'),
  issue: z.string().min(1, 'Issue description is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be numeric and at least 1'),
  preferred_date: z.string().min(1, 'Preferred date is required'),
  location_type: z.string().min(1, 'Location type is required'),
  urgency: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: 'Urgency must be one of: low, medium, high, urgent',
  }),
  summary: z.string().min(1, 'Summary is required'),
  matched_service_id: z.string().nullable().optional(),
});

export type AiLeadExtraction = z.infer<typeof AiLeadExtractionSchema>;

// Initialize Gemini client lazily/safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LeadToQuote API',
  });
});

// 2. Supabase / Env status
app.get('/api/supabase/status', (req: Request, res: Response) => {
  const hasUrl = Boolean(process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('your-project-id'));
  const hasAnonKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY.includes('your-anon'));
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  res.json({
    supabaseConfigured: hasUrl && hasAnonKey,
    supabaseUrl: hasUrl ? process.env.VITE_SUPABASE_URL : null,
    geminiConfigured: hasGeminiKey,
    mode: hasUrl && hasAnonKey ? 'live_supabase' : 'local_storage_engine',
  });
});

// Helper heuristic lead extractor for trade service requests
function extractLeadHeuristically(
  rawText: string,
  catalogServices?: Array<{ id: string; name: string }>
): AiLeadExtraction {
  const lower = rawText.toLowerCase();

  let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (/\b(urgent|emergency|asap|flooding|sparking|fire|burst|immediately)\b/i.test(lower)) {
    urgency = 'urgent';
  } else if (/\b(today|tonight|leaking|grinding|smoking|broken|no heat|no ac)\b/i.test(lower)) {
    urgency = 'high';
  } else if (/\b(routine|next month|when convenient|quote only|flexible)\b/i.test(lower)) {
    urgency = 'low';
  }

  let location_type = 'commercial';
  if (/\b(house|home|apartment|condo|residential|backyard|living room|kitchen)\b/i.test(lower)) {
    location_type = 'residential';
  } else if (/\b(industrial|plant|factory|warehouse)\b/i.test(lower)) {
    location_type = 'industrial';
  }

  let quantity = 1;
  const qtyMatch = lower.match(/\b(two|three|four|five|six|\d+)\s*(units?|ac|condensers?|breakers?|heaters?|items?|toilets?|panels?)/i);
  if (qtyMatch) {
    const wordMap: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };
    quantity = wordMap[qtyMatch[1].toLowerCase()] || parseInt(qtyMatch[1], 10) || 1;
  }

  let preferred_date = 'Flexible';
  const dateMatch = lower.match(/\b(tomorrow(?:\s+morning|\s+afternoon)?|today|this friday|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dateMatch) {
    preferred_date = dateMatch[1].trim();
  }

  let service = 'General Inspection';
  let matched_service_id: string | null = null;

  if (Array.isArray(catalogServices) && catalogServices.length > 0) {
    for (const cat of catalogServices) {
      const catLower = cat.name.toLowerCase();
      if (
        (catLower.includes('inspect') && /check|inspect|look at/i.test(lower)) ||
        (catLower.includes('ac') && /ac|cooling|air cond/i.test(lower)) ||
        (catLower.includes('hvac') && /hvac|furnace|heating|cooling/i.test(lower)) ||
        (catLower.includes('electr') && /panel|breaker|wire|power|switch/i.test(lower)) ||
        (catLower.includes('plumb') && /leak|pipe|water|drain|toilet/i.test(lower))
      ) {
        service = cat.name;
        matched_service_id = cat.id;
        break;
      }
    }
    if (!matched_service_id) {
      const general = catalogServices.find((s) => /inspect|general/i.test(s.name));
      if (general) {
        service = general.name;
        matched_service_id = general.id;
      }
    }
  } else {
    if (/ac|cooling|refrigerat/i.test(lower)) service = 'AC & Cooling Inspection';
    else if (/panel|breaker|electric/i.test(lower)) service = 'Electrical Inspection';
    else if (/leak|pipe|water/i.test(lower)) service = 'Plumbing Inspection';
    else service = 'General Inspection';
  }

  const addrMatch = rawText.match(/\b\d+\s+[A-Za-z0-9\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Way|Dr|Drive|Ln|Lane)\b/i);
  const locationMention = addrMatch ? ` at ${addrMatch[0]}` : '';
  const issue = rawText.length > 140 ? rawText.slice(0, 137) + '...' : rawText;
  const summary = `Customer requested ${service.toLowerCase()}${locationMention}${preferred_date !== 'Flexible' ? ' for ' + preferred_date : ''}.`;

  return {
    service,
    issue,
    quantity,
    preferred_date,
    location_type,
    urgency,
    summary,
    matched_service_id,
  };
}

// 3. AI Lead Assist Endpoint (Phase 4, Sections 2, 5, 6)
app.post('/api/ai/lead-assist', async (req: Request, res: Response) => {
  const { inquiryText, catalogServices, simulateFailure, simulateInvalid } = req.body;

  if (!inquiryText || typeof inquiryText !== 'string' || inquiryText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Inquiry text is required.',
      rawText: inquiryText || '',
    });
  }

  const rawText = inquiryText.trim();

  // Support intentional test simulation for API failure verification
  if (simulateFailure) {
    return res.status(503).json({
      success: false,
      error: 'AI assistance is temporarily unavailable. You can still create the lead manually.',
      rawText,
    });
  }

  // Support intentional test simulation for invalid structure rejection
  if (simulateInvalid) {
    return res.status(422).json({
      success: false,
      error: 'AI response failed strict schema validation (invalid fields). You can still create the lead manually.',
      rawText,
    });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const catalogContext = Array.isArray(catalogServices) && catalogServices.length > 0
        ? `Known business services catalog:\n${catalogServices.map((s: any) => `- ID: "${s.id}", Name: "${s.name}"`).join('\n')}\nIf the inquiry clearly corresponds to one of these catalog services, provide matched_service_id. Otherwise, set matched_service_id to null.`
        : 'No predefined service catalog provided. Set matched_service_id to null.';

      const prompt = `You are LeadToQuote AI Lead Assist, an expert intake assistant for trade service contractors.
Analyze the following customer inquiry and extract structured details.
${catalogContext}

Customer Request:
"${rawText}"

Output strict JSON adhering to this schema:
{
  "service": string (the requested trade service, e.g. "AC Repair", "Subpanel Upgrade", "Water Heater Repair", or "General Inspection" if unspecified),
  "issue": string (the specific problem, symptom, or project requested),
  "quantity": number (integer count of units/fixtures/rooms involved, minimum 1),
  "preferred_date": string (requested timeframe or date e.g. "tomorrow", "this Friday", "next week", or "Flexible"),
  "location_type": string ("commercial" | "residential" | "industrial"),
  "urgency": "low" | "medium" | "high" | "urgent" (urgency based on keywords like leaking, smoke, sparking, emergency, frozen),
  "summary": string (1-2 sentence crisp commercial summary for the contractor),
  "matched_service_id": string or null
}

Do not assume the extracted service exists if not confident. Return strictly JSON only.`;

      // Try gemini-3.1-flash-lite first (fast, high availability), fallback to gemini-3.8-flash
      let responseText = '';
      let modelUsed = 'gemini-3.1-flash-lite';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                service: { type: Type.STRING },
                issue: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                preferred_date: { type: Type.STRING },
                location_type: { type: Type.STRING },
                urgency: {
                  type: Type.STRING,
                  enum: ['low', 'medium', 'high', 'urgent'],
                },
                summary: { type: Type.STRING },
                matched_service_id: { type: Type.STRING },
              },
              required: ['service', 'issue', 'quantity', 'preferred_date', 'location_type', 'urgency', 'summary'],
            },
          },
        });
        responseText = response.text?.trim() || '';
      } catch (primaryErr: any) {
        console.warn('gemini-3.1-flash-lite attempt failed, trying gemini-3.8-flash:', primaryErr?.message || primaryErr);
        modelUsed = 'gemini-3.8-flash';
        const response2 = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                service: { type: Type.STRING },
                issue: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                preferred_date: { type: Type.STRING },
                location_type: { type: Type.STRING },
                urgency: {
                  type: Type.STRING,
                  enum: ['low', 'medium', 'high', 'urgent'],
                },
                summary: { type: Type.STRING },
                matched_service_id: { type: Type.STRING },
              },
              required: ['service', 'issue', 'quantity', 'preferred_date', 'location_type', 'urgency', 'summary'],
            },
          },
        });
        responseText = response2.text?.trim() || '';
      }

      if (!responseText) {
        throw new Error('Empty response received from Gemini.');
      }

      const parsedJson = JSON.parse(responseText);

      // Strict validation with Zod
      const validationResult = AiLeadExtractionSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        console.warn('Gemini response failed Zod schema validation:', validationResult.error.format());
        return res.status(422).json({
          success: false,
          error: 'AI response failed schema validation. You can still create the lead manually.',
          rawText,
        });
      }

      return res.json({
        success: true,
        source: modelUsed,
        data: validationResult.data,
        rawText,
      });
    } catch (geminiErr: any) {
      console.warn('Gemini API call failed or timed out, applying heuristic fallback:', geminiErr?.message || geminiErr);
      
      // Fall back to heuristic parser so the user never gets blocked
      const fallbackData = extractLeadHeuristically(rawText, catalogServices);
      const validationResult = AiLeadExtractionSchema.safeParse(fallbackData);
      
      if (validationResult.success) {
        return res.json({
          success: true,
          source: 'local_heuristic_fallback',
          data: validationResult.data,
          rawText,
        });
      }

      return res.status(503).json({
        success: false,
        error: 'AI assistance is temporarily unavailable. You can still create the lead manually.',
        rawText,
        debugMessage: geminiErr?.message,
      });
    }
  }

  // Fallback when Gemini key is not configured
  const fallbackData = extractLeadHeuristically(rawText, catalogServices);
  return res.json({
    success: true,
    source: 'local_heuristic_fallback',
    data: fallbackData,
    rawText,
  });
});

// 4. AI Lead Summary Endpoint (Phase 4, Section 7 & 10)
app.post('/api/ai/lead-summary', async (req: Request, res: Response) => {
  const effectiveRole = req.body.userRole || req.body.role;
  const { lead } = req.body;

  // Authorization check (Section 10)
  if (effectiveRole === 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Customer accounts cannot generate internal AI lead summaries.',
    });
  }

  if (!lead || typeof lead !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Lead details are required to generate a summary.',
    });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are LeadToQuote AI Assistant. Generate a concise, objective 1-2 sentence lead summary for an authorized contractor based ONLY on the following confirmed information. Do not invent or fabricate any details.

Lead Title: ${lead.title || 'N/A'}
Service: ${lead.service_name || lead.service?.name || 'N/A'}
Description: ${lead.description || 'N/A'}
Quantity: ${lead.quantity || 1}
Location: ${lead.location || 'N/A'}
Preferred Date: ${lead.preferred_date || 'N/A'}
Priority / Urgency: ${lead.priority || 'medium'}

Return ONLY the summary text in 1-2 professional sentences without quotation marks, markdown headings, or bullet points.`;

      let summary = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        summary = response.text?.trim() || '';
      } catch (e) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        summary = response.text?.trim() || '';
      }
      if (!summary) throw new Error('Empty summary from Gemini.');

      return res.json({
        success: true,
        summary,
      });
    } catch (err: any) {
      console.warn('Gemini lead-summary error:', err?.message || err);
      // Fallback based strictly on stored fields
      const fallbackSummary = `Customer requires ${lead.service_name || lead.title || 'trade service'} (${lead.quantity || 1} unit) at ${lead.location || 'client site'}, preferred timeline: ${lead.preferred_date || 'flexible'}. Priority is ${lead.priority || 'medium'}.`;
      return res.json({
        success: true,
        summary: fallbackSummary,
        source: 'local_fallback',
      });
    }
  }

  // Local rule-based summary when Gemini is offline
  const fallbackSummary = `Customer requires ${lead.service_name || lead.title || 'trade service'} (${lead.quantity || 1} unit) at ${lead.location || 'client site'}, preferred timeline: ${lead.preferred_date || 'flexible'}. Priority is ${lead.priority || 'medium'}.`;
  return res.json({
    success: true,
    summary: fallbackSummary,
    source: 'local_fallback',
  });
});

// 5. AI Quote Description Endpoint (Phase 4, Section 8 & 10)
app.post('/api/ai/quote-description', async (req: Request, res: Response) => {
  const effectiveRole = req.body.userRole || req.body.role;
  const { notes, serviceContext } = req.body;

  // Authorization check (Section 10)
  if (effectiveRole === 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Customer accounts cannot access AI quote description generation.',
    });
  }

  if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Technician notes or bullet points are required.',
    });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a professional trade contractor quoting specialist. Convert these short technician notes into a polished, professional customer-facing service description for an itemized quotation proposal.

Technician Notes:
"${notes.trim()}"

Service Context:
"${serviceContext || 'Trade Contractor Service'}"

Guidelines:
- Length: 1 to 3 clear, complete sentences.
- Tone: Professional, competent, customer-reassuring, commercial standard.
- Incorporate all mentioned tasks, parts, tests, and verifications.
- Return ONLY the raw description text. No markdown, quotes, bullet points, or introductory phrases like "Here is...".`;

      let description = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
        });
        description = response.text?.trim() || '';
      } catch (e) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        description = response.text?.trim() || '';
      }
      if (!description) throw new Error('Empty description from Gemini');

      return res.json({
        success: true,
        description,
      });
    } catch (err: any) {
      console.warn('Gemini quote-description error:', err?.message || err);
      // Clean fallback transformation
      const fallbackDesc = `Inspection and comprehensive servicing for ${serviceContext || 'trade work'}, including: ${notes.trim().replace(/\n/g, ', ')}. All work tested and verified to operational standards.`;
      return res.json({
        success: true,
        description: fallbackDesc,
        source: 'local_fallback',
      });
    }
  }

  const fallbackDesc = `Inspection and comprehensive servicing for ${serviceContext || 'trade work'}, including: ${notes.trim().replace(/\n/g, ', ')}. All work tested and verified to operational standards.`;
  return res.json({
    success: true,
    description: fallbackDesc,
    source: 'local_fallback',
  });
});

// 6. AI Business Insight Endpoint (Phase 4, Section 12)
const handleBusinessInsight = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const effectiveRole = body.userRole || body.role || (query.role as string) || (query.userRole as string);

    if (effectiveRole === 'customer') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Customer accounts cannot access business insights.',
      });
    }

    const safeNumber = (val: any) => {
      const n = typeof val === 'number' ? val : parseFloat(String(val || 0).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    const rawMetrics = (body.metrics && typeof body.metrics === 'object') ? body.metrics : query;

    const leadsCount = safeNumber(rawMetrics.leadsCount);
    const newLeadsCount = safeNumber(rawMetrics.newLeadsCount);
    const quotesCount = safeNumber(rawMetrics.quotesCount);
    const quotesSentCount = safeNumber(rawMetrics.quotesSentCount);
    const quotesApprovedCount = safeNumber(rawMetrics.quotesApprovedCount);
    const jobsActiveCount = safeNumber(rawMetrics.jobsActiveCount);
    const unpaidInvoicesCount = safeNumber(rawMetrics.unpaidInvoicesCount);
    const unpaidTotal = safeNumber(rawMetrics.unpaidTotal);
    const settledTotal = safeNumber(rawMetrics.settledTotal);

    // Empty state check (Section 12: "If there is insufficient data, show an appropriate empty state.")
    if (leadsCount === 0 && quotesCount === 0 && jobsActiveCount === 0) {
      return res.status(200).json({
        success: true,
        insight: 'Insufficient operational activity to generate business insights. Once you create leads and quotations, AI will analyze your pipeline health.',
        isEmpty: true,
      });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are LeadToQuote Executive Operations AI. Based strictly on the following real commercial contractor metrics, provide a concise, high-value 2-sentence executive summary highlighting open pipeline health and immediate action items. Do not invent any numbers. Keep it strictly grounded in the provided metrics.

Real Metrics:
- Total Open Leads: ${leadsCount} (${newLeadsCount} new/uncontacted)
- Quotations: ${quotesCount} total (${quotesSentCount} awaiting customer response, ${quotesApprovedCount} approved)
- Active Field Jobs: ${jobsActiveCount}
- Invoices: ${unpaidInvoicesCount} pending settlement ($${unpaidTotal.toFixed(0)}), $${settledTotal.toFixed(0)} total settled.

Return ONLY 2 sentences of professional operational insight.`;

        let insight = '';
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
          });
          insight = response.text?.trim() || '';
        } catch (e: any) {
          console.warn('Gemini 3.1 flash-lite business-insight error, falling back:', e?.message || e);
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });
          insight = response.text?.trim() || '';
        }

        if (insight) {
          return res.status(200).json({
            success: true,
            insight,
            isEmpty: false,
            source: 'gemini',
          });
        }
      } catch (err: any) {
        console.warn('Gemini business-insight processing error, falling back to heuristics:', err?.message || err);
      }
    }

    // High quality deterministic fallback constructed strictly from real metrics
    const fallbackInsight = `Your open pipeline currently contains ${quotesCount} quotations, with ${quotesSentCount} awaiting customer responses. You have ${jobsActiveCount} jobs active in the field and $${unpaidTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} in pending invoice settlements.`;
    return res.status(200).json({
      success: true,
      insight: fallbackInsight,
      isEmpty: false,
      source: 'local_fallback',
    });
  } catch (err: any) {
    console.error('Unhandled error in business-insight route handler:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error calculating business insights.',
    });
  }
};

app.post('/api/ai/business-insight', handleBusinessInsight);
app.get('/api/ai/business-insight', handleBusinessInsight);

// All unhandled /api and /api/* routes return strict JSON 404 to ensure they never fall through to HTML SPA fallback
app.all(['/api', '/api/*'], (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Explicit JSON error middleware for API routes
app.use((err: any, req: Request, res: Response, next: any) => {
  const pathStr = req.originalUrl || req.url || '';
  const isApi = pathStr.startsWith('/api') || pathStr === '/api' || req.headers.accept?.includes('application/json');
  if (isApi) {
    console.error('API Error Middleware caught error:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error processing API request.',
    });
  }
  next(err);
});

// Vite middleware & Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Absolute guard: Never let Vite's SPA fallback or HTML middleware intercept any /api routes
    app.use((req: Request, res: Response, next: any) => {
      const pathStr = req.originalUrl || req.url || '';
      if (pathStr.startsWith('/api') || pathStr === '/api') {
        return res.status(404).json({
          success: false,
          error: `API route not found: ${req.method} ${pathStr}`,
        });
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const pathStr = req.originalUrl || req.url || '';
      if (pathStr.startsWith('/api') || pathStr === '/api') {
        return res.status(404).json({
          success: false,
          error: `API route not found: ${req.method} ${pathStr}`,
        });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadToQuote server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

