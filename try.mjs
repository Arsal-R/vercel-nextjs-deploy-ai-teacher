import { Polly } from "@aws-sdk/client-polly";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

// Create Polly client with credentials from environment variables
const pollyClient = new Polly({
  credentials: fromEnv(),
  region: process.env.AWS_REGION,
});

// Function to synthesize speech
const synthesizeSpeech = async (text) => {
  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna',
  };

  try {
    const speechData = await pollyClient.synthesizeSpeech(params);
    return speechData;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};


// Function to save the audio stream to an MP3 file
const saveAudioToFile = (audioStream, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = `./${filename}`;

    // Creating a writable stream to write the AudioStream into an MP3 file
    const fileStream = fs.createWriteStream(filePath);

    audioStream.on('data', chunk => fileStream.write(chunk));
    audioStream.on('end', () => {
      fileStream.end();
      console.log(`File saved: ${filePath}`);
      resolve(filePath);
    });
    audioStream.on('error', error => {
      console.error('Error writing file:', error);
      reject(error);
    });
  });
};


// Sample text for testing
const sampleText = "Hello, this is a test message to synthesize speech with Amazon Polly using AWS SDK v3.";

// Call the function and handle the synthesized speech
synthesizeSpeech(sampleText)
  .then((data) => {
    // Check if audioStream is a Buffer or a Stream
    if (data.AudioStream instanceof Buffer) {
      // If it's a Buffer, write directly to file
      fs.writeFileSync('speech.mp3', data.AudioStream);
      console.log('File saved: speech.mp3');
    } else {
      // If it's a Stream, use the saveAudioToFile function
      return saveAudioToFile(data.AudioStream, 'speech.mp3');
    }
  })
  .then((filePath) => {
    // The audio file is saved successfully, you can add additional logic here if needed
  })
  .catch((error) => {
    console.error('Error synthesizing speech or saving file:', error);
  });