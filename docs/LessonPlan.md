> **Status: draft, reviewed.** Findings and the revised plan are in [backlog/US-3.3-transcripts-and-lesson-plans.md](./backlog/US-3.3-transcripts-and-lesson-plans.md) and DESIGN.md D18-D24. Do not implement the code below as written (no year in the filename, blob trigger unsupported on SWA managed Functions, silent fallback summaries, 12,000-character truncation).

# Lesson Plan Generation & Transcript Indexing System Spec

## Overview
This document specifies the implementation of the automated transcript summarization, event-driven indexing, and lesson plan generation system for the Matayoshi Kobudo study group platform. The system uses Azure Functions (Node.js), Azure Blob Storage, Azure Table Storage, and Azure OpenAI to dynamically generate session lesson plans based on attendance rosters and filtered historical class summaries.

---

## 1. Core Architecture & Data Flow

1. **Transcript Ingestion & Summarization (Event-Driven)**:
   - When a new transcript text file is uploaded to the Azure Blob Storage container (`transcripts/{name}`), an Azure Blob Storage trigger fires.
   - The function parses the filename convention (`Matayoshi Kobudo - YYYYMMDD - Weekly Class X of 52`), computes the absolute class ID ($((Year - 1) \times 52) + ClassNumber$), and invokes Azure OpenAI to generate a structured 3-sentence summary, title, and weapon tags.
   - The function updates and sorts `class-summaries.json` stored in the blob container.

2. **Roster Evaluation & Constraint Calculation**:
   - When a session is initialized or attendees check in, the backend retrieves the participants' maximum attended classes from Azure Table Storage.
   - The system determines the minimum absolute class ID present among all attendees (the "Lowest Grade Bound" rule).

3. **Lesson Plan Synthesis**:
   - The system reads `class-summaries.json` and filters entries where `absoluteId <= minAbsoluteClass`.
   - The filtered summaries are injected into the Azure OpenAI prompt payload to synthesize a targeted, grade-appropriate 60-minute session review plan.

---

## 2. Module Implementation: `transcriptIndexer/index.js`

```javascript
const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const axios = require('axios');

const STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
const CONTAINER_NAME = 'transcripts';
const INDEX_BLOB_NAME = 'class-summaries.json';

app.storageBlob('transcriptIndexer', {
    path: `${CONTAINER_NAME}/{name}`,
    connection: 'AzureWebJobsStorage',
    handler: async (blob, context) => {
        const blobName = context.triggerMetadata.name;
        context.log(`Processing newly uploaded transcript: ${blobName}`);

        if (blobName === INDEX_BLOB_NAME) return;

        // Filename parsing: "Matayoshi Kobudo - 20230513 - Weekly Class 14 of 52.txt"
        const match = blobName.match(/Matayoshi Kobudo - (\d{8}) - Weekly Class (\d+) of 52/i);
        if (!match) {
            context.log.warn(`Filename does not match expected convention: ${blobName}`);
            return;
        }

        const dateStr = match[1];
        const classNumber = parseInt(match[2], 10);
        const year = parseYearFromBlobName(blobName) || 1;
        const absoluteId = ((year - 1) * 52) + classNumber;

        const transcriptText = blob.toString('utf-8');
        const summaryData = await generateSummaryWithAI(transcriptText, absoluteId, context);
        await updateSummariesIndex(absoluteId, summaryData, blobName, context);
    }
});

function parseYearFromBlobName(name) {
    const match = name.match(/Year (\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
}

async function generateSummaryWithAI(text, absoluteId, context) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    try {
        const response = await axios.post(
            `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
            {
                messages: [
                    { role: "system", content: "You are an expert Kobudo instructor. Summarize the provided class transcript into a concise 3-sentence summary, identifying the primary weapon focus and technical title. Return valid JSON: { \"title\": \"...\", \"weapon\": \"...\", \"summary\": \"...\" }" },
                    { role: "user", content: text.substring(0, 12000) } // Truncate token limit safely
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
            }
        );
        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        context.log.error("Azure OpenAI Summary Generation Error:", error.message);
        return {
            title: `Class ${absoluteId} Review`,
            weapon: "Bo / Unarmed",
            summary: "Automated summary generation failed; fallback summary applied."
        };
    }
}

async function updateSummariesIndex(absoluteId, summaryData, blobName, context) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(INDEX_BLOB_NAME);

    let summaries = [];
    try {
        if (await blockBlobClient.exists()) {
            const downloadResponse = await blockBlobClient.download(0);
            const content = await streamToString(downloadResponse.readableStreamBody);
            summaries = JSON.parse(content);
        }
    } catch (err) {
        context.log.error("Error reading existing summaries index:", err);
    }

    const existingIndex = summaries.findIndex(s => s.absoluteId === absoluteId);
    const entry = { absoluteId, blobPath: blobName, ...summaryData };

    if (existingIndex >= 0) {
        summaries[existingIndex] = entry;
    } else {
        summaries.push(entry);
    }

    summaries.sort((a, b) => a.absoluteId - b.absoluteId);

    const data = JSON.stringify(summaries, null, 2);
    await blockBlobClient.upload(data, Buffer.byteLength(data), {
        blobHTTPHeaders: { blobContentType: 'application/json' }
    });
    context.log(`Successfully updated ${INDEX_BLOB_NAME} for absoluteId ${absoluteId}`);
}

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}