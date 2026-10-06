import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/server/admin/auth";
import { saveUpload, UploadError } from "@/server/admin/media";

/** Admin photo upload (multipart, field "files"). A route handler, so large photos aren't capped by the Server Action body limit. */
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ ok: false, error: "Not authorised" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return NextResponse.json({ ok: false, error: "Choose at least one photo." }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ ok: false, error: "Upload up to 20 photos at a time." }, { status: 400 });

  const items = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      items.push(await saveUpload(file));
    } catch (e) {
      errors.push(e instanceof UploadError ? e.message : `${file.name} failed to upload.`);
      if (!(e instanceof UploadError)) console.error("[upload]", e);
    }
  }
  return NextResponse.json({ ok: items.length > 0, items, errors, error: errors[0] }, { status: items.length ? 200 : 400 });
}
