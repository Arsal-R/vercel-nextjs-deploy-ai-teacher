import { Polly } from "@aws-sdk/client-polly";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import dotenv from 'dotenv';

dotenv.config();

// Create Polly client with credentials from environment variables
const pollyClient = new Polly({
  credentials: fromEnv(),
  region: process.env.AWS_REGION,
});

// Function to synthesize speech and fetch viseme data with Amazon Polly
async function synthesizeWithPollyAndFetchVisemes(text) {
  const audioParams = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Ivy',
  };

  const visemeParams = {
    Text: text,
    OutputFormat: 'json',
    VoiceId: 'Ivy',
    SpeechMarkTypes: ['viseme'],
  };

  try {
    // Synthesize speech
    const audioData = await pollyClient.synthesizeSpeech(audioParams);
    const audioStream = audioData.AudioStream;

    // Fetch viseme data
    const visemeData = await pollyClient.synthesizeSpeech(visemeParams);
    const visemes = await streamToString(visemeData.AudioStream);

    return { audioStream, visemes };
  } catch (error) {
    console.error('Error synthesizing speech with Polly or fetching visemes:', error);
    throw error;
  }
}

// Helper function to convert stream to string
function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

export async function GET(req) {
  const text = req.nextUrl.searchParams.get("text") || "I'm excited to try text to speech with Amazon Polly";

  try {
    const { audioStream, visemes } = await synthesizeWithPollyAndFetchVisemes(text);
    const headers = {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="tts.mp3"`,
      "X-Viseme-Data": encodeURIComponent(visemes), // Assuming visemes are handled as a JSON string
    };

    return new Response(audioStream, { headers });

  } catch (error) {
    console.error('Error in Polly TTS or fetching visemes:', error);
    return new Response(null, { status: 500 });
  }
}