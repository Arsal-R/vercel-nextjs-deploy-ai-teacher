import { Polly } from "@aws-sdk/client-polly";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import dotenv from 'dotenv';

dotenv.config();

// Create Polly client with credentials from environment variables
const pollyClient = new Polly({
  credentials: fromEnv(),
  region: process.env.AWS_REGION,
});

const aws_to_ms_viseme_mapping = {
  "p": 21, "t": 19, "S": 16, "T": 17, "f": 18, "k": 20, "i": 6, "r": 13, "s": 15,
  "@": 13, "a": 5, "e": 4, "E": 4, "o": 8, "u": 7, "c": 14, "O": 10, "x": 20, 
  "l": 14, "n": 19, "b": 21, "d": 19, "g": 20, "v": 18, "z": 15, "Z": 16, "A": 5, 
  "I": 6, "U": 7, "q": 20, "C": 14, "L": 14, "M": 21, "N": 19, "R": 13, "G": 20, 
  "B": 21, "D": 19, "F": 18, "H": 12, "J": 16, "K": 20, "P": 21, "Q": 20, "V": 18, 
  "W": 7,  "X": 20, "Y": 6,  "sil": null
}

// Function to synthesize speech and fetch viseme data with Amazon Polly
async function synthesizeWithPollyAndFetchVisemes(text) {
  const audioParams = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna',
  };

  const visemeParams = {
    Text: text,
    OutputFormat: 'json',
    VoiceId: 'Joanna',
    SpeechMarkTypes: ['viseme'],
  };
  
  try {
    // Synthesize speech
    const audioData = await pollyClient.synthesizeSpeech(audioParams);
    const audioStream = audioData.AudioStream;

    // Fetch viseme data
    const visemeData = await pollyClient.synthesizeSpeech(visemeParams);
    const visemes = await streamToString(visemeData.AudioStream);
    console.log(visemes)

    // Convert the AWS Polly viseme data string to an object
    const visemeObjects = convertToObjectList(visemes)

    // Map AWS Polly visemes to Microsoft TTS visemes using the provided dictionary
    const VSMS = visemeObjects.map(viseme => {
      const msVisemeId = aws_to_ms_viseme_mapping[viseme.value];
      return { ...viseme, value: msVisemeId };
    });
    const msVisemes = extractTimeAndValue(VSMS)
    console.log(msVisemes)

    return { audioStream, visemes: JSON.stringify(msVisemes) };

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

function convertToObjectList(inputString) {
  const parts = inputString.split('}').filter(part => part.trim() !== '');
  const jsonObjects = parts.map(part => part.trim() + '}');

  const jsonArrayString = '[' + jsonObjects.join(',') + ']';
  const objectList = JSON.parse(jsonArrayString);

  return objectList;
}

function extractTimeAndValue(jsonArray) {
  return jsonArray.map(item => [item.time, item.value]);
}

export async function GET(req) {
  const text = req.nextUrl.searchParams.get("text") || "I'm excited to try text to speech with Amazon Polly";

  try {
    const { audioStream, visemes } = await synthesizeWithPollyAndFetchVisemes(text);
    console.log(visemes)
    const headers = {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="tts.mp3"`,
      visemes: visemes,
    };

    return new Response(audioStream, { headers });

  } catch (error) {
    console.error('Error in Polly TTS or fetching visemes:', error);
    return new Response(null, { status: 500 });
  }
}


// import * as sdk from "microsoft-cognitiveservices-speech-sdk";
// import { PassThrough } from "stream";

// export async function GET(req) {
//   // WARNING: Do not expose your keys
//   // WARNING: If you host publicly your project, add an authentication layer to limit the consumption of Azure resources

//   const speechConfig = sdk.SpeechConfig.fromSubscription(
//     process.env["SPEECH_KEY"],
//     process.env["SPEECH_REGION"]
//   );

//   // https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
//   const teacher = req.nextUrl.searchParams.get("teacher") || "Nanami";
//   speechConfig.speechSynthesisVoiceName = `en-US-SaraNeural`;

//   const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
//   const visemes = [];
//   speechSynthesizer.visemeReceived = function (s, e) {
//     // console.log(
//     //   "(Viseme), Audio offset: " +
//     //     e.audioOffset / 10000 +
//     //     "ms. Viseme ID: " +
//     //     e.visemeId
//     // );
//     visemes.push([e.audioOffset / 10000, e.visemeId]);
//   };
//   const audioStream = await new Promise((resolve, reject) => {
//     speechSynthesizer.speakTextAsync(
//       req.nextUrl.searchParams.get("text") ||
//         "I'm excited to try text to speech",
//       (result) => {
//         const { audioData } = result;

//         speechSynthesizer.close();

//         // convert arrayBuffer to stream
//         const bufferStream = new PassThrough();
//         bufferStream.end(Buffer.from(audioData));
//         resolve(bufferStream);
//       },
//       (error) => {
//         console.log(error);
//         speechSynthesizer.close();
//         reject(error);
//       }
//     );
//   });
//   const response = new Response(audioStream, {
//     headers: {
//       "Content-Type": "audio/mpeg",
//       "Content-Disposition": `inline; filename=tts.mp3`,
//       Visemes: JSON.stringify(visemes),
//     },
//   });
//   // audioStream.pipe(response);
//   return response;
// }