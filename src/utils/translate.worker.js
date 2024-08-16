import { pipeline,env } from "@xenova/transformers";
env.allowLocalModels = false;



class TranslationWorker {
    static model = 'Xenova/nllb-200-distilled-600M'; 
    static translator = null;

    static async initialize() {
        if (this.translator === null) {
            try {
                console.log("Initializing model...");
                this.translator = await pipeline('translation', this.model);
                console.log("Model initialized.");
            } catch (error) {
                console.error("Error initializing model:", error);
                self.postMessage({
                    status: 'error',
                    error: "Model initialization failed: " + error.message
                });
                throw error;
            }
        }
        return this.translator;
    }
}

self.addEventListener('message', async (event) => {
    const { text, src_lang, tgt_lang } = event.data;
    console.log('workerl',text,tgt_lang)
    try {
        const translator = await TranslationWorker.initialize();

        const result = await translator(text, {
            src_lang: src_lang || 'eng_Latn', 
            tgt_lang: tgt_lang 
        });

        self.postMessage({
            status: 'complete',
            output: result
        });
    } catch (error) {
        console.error("Error during translation:", error);
        self.postMessage({
            status: 'error',
            error: "Translation failed: " + error.message
        });
    }
});