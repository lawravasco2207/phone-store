import AzureOpenAI from "openai";

const openai = new AzureOpenAI({
    // Azure endpoint
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,

    // Azure API key
    apiKey: process.env.AZURE_OPENAI_KEY,

    // Azure requires a custom base path and headers
    defaultHeaders: {
        "api-key": process.env.AZURE_OPENAI_KEY,
    }
})

const getResponse = async () => {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Hello from Azure OpenAI!" }],
        model: process.env.MODEL_NAME, // This must match your Azure deployment name
    });

    console.log(completion.choices[0].message.content);
};

