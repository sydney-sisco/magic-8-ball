module.exports = [
    {
        name: 'draw',
        prefix: '!draw',
        description: 'Use code to generate an image',
        execute: async (message, args, context) => {
            const response = await draw(message);
            message.reply(response);
        },
    },
]

const { createCanvas } = require('canvas');
const fs = require('fs');

const { EmbedBuilder } = require('discord.js');

const OpenAI = require("openai");
const { saveLocalImage } = require('../util/digitalOceanSpaces.js');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const { getOptions } = require('../util/shared-helpers.js');

const PREFIX = '!draw';

const draw = async (message) => {
    const member = message.member.id;
    const userPromptWithOptions = message.content.slice(PREFIX.length).trim();
    const [userPrompt, options] = getOptions(userPromptWithOptions);

    return await createImage(userPrompt, member, message, options);
};


function setupCanvasAndDraw(drawCodeString) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // YOUR CODE EVALUATED HERE
    eval(drawCodeString);

    const buffer = canvas.toBuffer('image/png');
    return buffer;

    // fs.writeFileSync('happy_face3.png', buffer);
    // return 'OK';
}

const system_message = `
You are a creative output bot. Accept a user prompt and use it to create a drawing using javascript canvas. You draw using javascript on canvas. 
Your code will be directly passed into the following function, so please output just the code, no extra formatting.

function setupCanvasAndDraw(drawCodeString) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // YOUR CODE EVALUATED HERE
    eval(drawCodeString);

    const buffer = canvas.toBuffer('image/png');
    return buffer;

    fs.writeFileSync('happy_face3.png', buffer);
    return 'OK';
}

You will have access to these helper functions:
// Draw goblins attacking
function drawGoblin(x, y) {
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2, true); // Head
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x, y + 5, 8, 0, Math.PI, false);
    ctx.fill();

    // Body
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 10, y + 20, 20, 30);

    // Arms
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 30);
    ctx.lineTo(x - 25, y + 50);
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + 25, y + 50);
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// Draw Power Rangers
function drawPowerRanger(x, y, color) {
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2, true);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(x, y + 5, 8, 0, Math.PI, false);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - 10, y + 20, 20, 30);

    // Arms
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 30);
    ctx.lineTo(x - 25, y + 50);
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + 25, y + 50);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
}

please be as creative as you need to be to satisfy the user request.
`

const happyFaceString = `
        // Draw a happy face
        ctx.fillStyle = '#000000';

        // Face circle
        ctx.beginPath();
        ctx.arc(400, 300, 200, 0, Math.PI * 2, true);
        ctx.fill();

        // Eyes
        ctx.beginPath();
        ctx.arc(320, 250, 30, 0, Math.PI * 2, true);
        ctx.arc(480, 250, 30, 0, Math.PI * 2, true);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Mouth
        ctx.beginPath();
        ctx.arc(400, 350, 100, 0, Math.PI, false);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.stroke();
    `
function generateDrawingCodeForHappyFace() {
    return happyFaceString;
}

const helperFunctionCodeString = `
// Draw goblins attacking
function drawGoblin(x, y) {
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2, true); // Head
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x, y + 5, 8, 0, Math.PI, false);
    ctx.fill();

    // Body
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 10, y + 20, 20, 30);

    // Arms
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 30);
    ctx.lineTo(x - 25, y + 50);
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + 25, y + 50);
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// Draw Power Rangers
function drawPowerRanger(x, y, color) {
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2, true);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.arc(x + 7, y - 5, 3, 0, Math.PI * 2, true);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(x, y + 5, 8, 0, Math.PI, false);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - 10, y + 20, 20, 30);

    // Arms
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 30);
    ctx.lineTo(x - 25, y + 50);
    ctx.moveTo(x + 10, y + 30);
    ctx.lineTo(x + 25, y + 50);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
}
`

async function generateDrawingCode(userPromp) {

    const messages = [
        {
            role: 'system',
            content: system_message + happyFaceString,
        },
        {
            role: 'user',
            content: 'the user prompt is: ' + userPromp + ". Please output ONLY JAVASCRIPT CODE without any formatting surrounding it NO BACKTICKS NO QUOTES SURROUNDING THE CODE JUST GO GO GO WITH THE CODE!!! Have FUN!",
        }
    ]

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
    });

    const code_for_drawing = response.choices[0].message.content

    console.log(code_for_drawing);

    return code_for_drawing
}

const createImage = async (userPrompt, member, message, options) => {

    const showPrompt = !options.includes('quiet');

    message.react('1️⃣');

    try {
        const drawCodeString = await generateDrawingCode(userPrompt);
        message.react('2️⃣');



        const imageBuffer = setupCanvasAndDraw(helperFunctionCodeString + drawCodeString);
        message.react('3️⃣');

        const hostedImageUrl = await saveLocalImage(imageBuffer, userPrompt, member)
        message.react('4️⃣');

        const imageEmbed = new EmbedBuilder()
            .setTitle(`I drew: ${showPrompt ? userPrompt.substring(0, 100) : "???"}`)
            .setImage(hostedImageUrl)
            .setColor('#0099ff')
            .setTimestamp();

        message.react('✅');

        return { embeds: [imageEmbed] };

        return 'OK'

    } catch (error) {
        if (error.response) {
            console.log('error status: ', error.response.status);
            console.log('error data: ', error.response.data);
            message.react('❌');
            return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
        } else {
            console.log('error message: ', error.message);
            message.react('❌');
            return `API Error: ${error.message}`;
        }
    }
}
