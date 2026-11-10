import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen en base64' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no está configurada en el servidor' }, { status: 500 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Analiza esta imagen (puede ser un producto físico o una factura/recibo). Extrae la siguiente información en formato JSON estrictamente: 'nombre' (string, nombre del producto o item principal), 'precio' (number, precio unitario), 'categoria' (string, categoría sugerida del producto), 'cantidad' (number, cantidad en stock o comprada, por defecto 1). No incluyas markdown, solo el JSON raw."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ error: 'Error en Gemini API' }, { status: response.status });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json({ error: 'Respuesta vacía de Gemini' }, { status: 500 });
    }

    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textOutput);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
