// Script mejorado para subir plantillas a Supabase Storage
// Ejecutar: node upload-templates-fixed.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://eapcqcuzfkpqngbvjtmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGNxY3V6ZmtwcW5nYnZqdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTA5MDAsImV4cCI6MjA1MjQ2NjkwMH0.6xc0S8eI8gW6TJVT1S6xkf5wabfZb-TgHvYwSq2p_V8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadTemplates() {
    const templatesDir = path.join(__dirname, 'public', 'templates');

    // Solo subir plantillas de hombres
    const files = fs.readdirSync(templatesDir)
        .filter(f => f.startsWith('muestra_hombre_') && f.endsWith('.jpg'));

    console.log(`Encontrados ${files.length} archivos de plantillas de hombres`);

    for (const file of files) {
        const filePath = path.join(templatesDir, file);
        const fileBuffer = fs.readFileSync(filePath);

        console.log(`\nSubiendo ${file}...`);
        console.log(`Tamaño: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

        try {
            // Primero intentar eliminar si existe
            await supabase.storage
                .from('generacion-imagenes')
                .remove([`templates/${file}`]);

            // Subir con configuración correcta
            const { data, error } = await supabase.storage
                .from('generacion-imagenes')
                .upload(`templates/${file}`, fileBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error subiendo ${file}:`, error);
            } else {
                console.log(`✅ ${file} subido exitosamente`);

                // Verificar URL pública
                const { data: urlData } = supabase.storage
                    .from('generacion-imagenes')
                    .getPublicUrl(`templates/${file}`);

                console.log(`   URL: ${urlData.publicUrl}`);
            }
        } catch (err) {
            console.error(`❌ Error procesando ${file}:`, err.message);
        }
    }

    console.log('\n✅ Proceso completado!');
}

uploadTemplates().catch(console.error);
