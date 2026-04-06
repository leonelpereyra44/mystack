import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabaseAdmin, LOGOS_BUCKET } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }

    // Validar tamaño (máx 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 2MB." },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop();
    const fileName = `${business.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Si ya tiene un logo, eliminarlo
    if (business.logo) {
      const oldFileName = business.logo.split("/").pop();
      if (oldFileName) {
        await supabaseAdmin.storage.from(LOGOS_BUCKET).remove([oldFileName]);
      }
    }

    // Subir a Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    
    // Debug: verificar que tenemos la service key
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("Service Key starts with:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30));
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from(LOGOS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError);
      return NextResponse.json(
        { error: "Error al subir la imagen" },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(LOGOS_BUCKET)
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Actualizar business con la nueva URL del logo
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: logoUrl },
    });

    return NextResponse.json({ url: logoUrl });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    if (!business.logo) {
      return NextResponse.json(
        { error: "No hay logo para eliminar" },
        { status: 400 }
      );
    }

    // Eliminar de Supabase Storage
    const fileName = business.logo.split("/").pop();
    if (fileName) {
      await supabaseAdmin.storage.from(LOGOS_BUCKET).remove([fileName]);
    }

    // Actualizar business
    await prisma.business.update({
      where: { id: business.id },
      data: { logo: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      { error: "Error al eliminar el logo" },
      { status: 500 }
    );
  }
}
