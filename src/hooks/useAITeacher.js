const { create } = require("zustand");

export const teachers = ["Nanami", "Naoki"];

export const useAITeacher = create((set, get) => ({
    messages: [],
    currentMessage: null,
    teacher: teachers[0],
    setTeacher: (teacher) => {
        set(() => ({
            teacher,
            messages: get().messages.map((message) => {
                message.audioPlayer = null;
                return message;
            }),
        }));
    },
    classroom: "default",
    setClassroom: (classroom) => {
        set(() => ({
            classroom,
        }));
    },
    loading: false,
    cantonese: false,
    setCantonese: (cantonese) => {
        set(() => ({
            cantonese,
        }));
    },
    english: true,
    setEnglish: (english) => {
        set(() => ({
            english,
        }));
    },
    speech: "answer",
    setSpeech: (speech) => {
        set(() => ({
            speech,
        }));
    },
    STT: async (audioblob) => {
        console.log("Received audio blob")
        console.log(audioblob)

        const formData = new FormData();
        formData.append("audio", audioblob, "audio_file.ogg");

        const audi_res = await fetch("/api/stt", {
            method: 'POST',
            body: formData
        });
        const data = audi_res.json();
        console.log("Data is ")
        console.log(data)
    },
    askAI: async (question, cantonese, prompt) => {
        if (!question) {
            return;
        }
        const message = {
            question,
            id: get().messages.length,
        };
        set(() => ({
            loading: true,
        }));

        const speech = get().speech;

        // Ask AI
        const res = await fetch(`/api/ai?question=${question}&speech=${speech}&prompt=${prompt}`);
        const data = await res.json();

        console.log('Data is :')
        console.log(data.answer)
        message.answer = data.answer;
        message.speech = speech;

        set(() => ({
            currentMessage: message,
        }));

        set((state) => ({
            messages: [...state.messages, message],
            loading: false,
        }));
        console.log(message)
        get().playMessage(message, cantonese);
    },
    playMessage: async (message, cantonese) => {
        set(() => ({
            currentMessage: message,
        }));

        if (!message.audioPlayer) {
            set(() => ({
                loading: true,
            }));
            console.log(message);

            const audioRes = await fetch(`/api/tts?text=${message.answer}&language=${cantonese ? "cantonese" : "english"}`);
            const audio = await audioRes.blob();
            // console.log(audioRes.headers.get("visemes"))

            const visemes = JSON.parse(await audioRes.headers.get("visemes"));
            const audioUrl = URL.createObjectURL(audio);
            const audioPlayer = new Audio(audioUrl);

            message.visemes = visemes;
            message.audioPlayer = audioPlayer;
            message.audioPlayer.onended = () => {
                set(() => ({
                    currentMessage: null,
                }));
            };
            set(() => ({
                loading: false,
                messages: get().messages.map((m) => {
                    if (m.id === message.id) {
                        return message;
                    }
                    return m;
                }),
            }));
        }

        message.audioPlayer.currentTime = 0;
        message.audioPlayer.play();
    },
    stopMessage: (message) => {
        message.audioPlayer.pause();
        set(() => ({
            currentMessage: null,
        }));
    },
}));
