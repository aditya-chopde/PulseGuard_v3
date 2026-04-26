import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

export const analyzeAudio = async (filePath) => {
    try {
        const absolutePath = path.resolve(filePath.startsWith('/') ? filePath.substring(1) : filePath); // Strip leading slash if present
        
        // 1. Create a FormData instance
        const form = new FormData();
        
        // 2. Append the file stream. Assuming the Python app expects an 'audio' field
        form.append('file', fs.createReadStream(absolutePath));

        // 3. Make the POST request to FastAPI
        const response = await axios.post(process.env.AI_SERVICE_URL, form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        // Expected response format from Python AI: 
        // { disease: "Murmur", severity: 80, probability: 95.5, acousticIndex: 70 }
        return response.data;
    } catch (error) {
        console.error('AI Service Error:', error?.response?.data || error.message);
        return { error: error?.response?.data?.detail || error?.response?.data?.error || error.message || 'Failed to analyze audio through AI service' };
    }
};
